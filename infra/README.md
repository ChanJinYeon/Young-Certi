# Infra

Terraform owns all AWS resources. Local verification must run through the
`tf` docker compose service.

## Module Map

- `modules/s3-bucket`: reusable private S3 bucket primitive.
- `modules/tfstate-bucket`: remote Terraform state bucket wrapper.
- `modules/data-bucket`: private question artifact bucket wrapper.
- `modules/vpc`: low-cost dev VPC for EKS. It intentionally avoids NAT
  Gateway to keep the ephemeral cluster cheap; public subnets are tagged for
  Kubernetes load balancers and Karpenter discovery.
- `modules/eks`: EKS control plane, one small bootstrap managed node group,
  Karpenter IAM/SQS/EventBridge wiring, Karpenter Helm release, and optional
  `EC2NodeClass` / `NodePool` manifests.
- `modules/github-oidc`: GitHub Actions OIDC provider and role, so CI can
  assume AWS permissions without long-lived access keys.

## EKS / Karpenter Shape

Karpenter is installed as a Helm chart into the EKS cluster. Because Karpenter
is itself a Kubernetes controller, it needs a first place to run. The
`modules/eks` module creates a minimal managed node group for system workloads,
then Karpenter can create Spot nodes for application pods.

The default dev plan keeps `enable_ephemeral_cluster = false`, so local checks
cannot accidentally create cost-bearing EKS resources. To inspect the full EKS
plan graph without applying the Kubernetes manifests:

```sh
docker compose run --rm tf terraform -chdir=infra/envs/dev plan \
  -var enable_ephemeral_cluster=true
```

`EC2NodeClass` and `NodePool` are intentionally a second phase. The Kubernetes
provider needs the EKS endpoint and certificate authority from the first apply,
and Karpenter CRDs must exist before Terraform can manage those manifests.
GitHub Actions handles this by running one apply with
`manage_karpenter_manifests=false`, then a second apply with
`manage_karpenter_manifests=true`.

For local AWS testing, create the real stack in the same two phases:

```sh
docker compose run --rm tf terraform -chdir=infra/envs/dev apply \
  -var account_id=<12-digit-account-id> \
  -var enable_ephemeral_cluster=true \
  -var skip_credentials_validation=false

docker compose run --rm tf terraform -chdir=infra/envs/dev apply \
  -var account_id=<12-digit-account-id> \
  -var enable_ephemeral_cluster=true \
  -var manage_karpenter_manifests=true \
  -var skip_credentials_validation=false
```

Destroy the EKS stack after demos:

```sh
docker compose run --rm tf terraform -chdir=infra/envs/dev destroy \
  -var account_id=<12-digit-account-id> \
  -var enable_ephemeral_cluster=true \
  -var skip_credentials_validation=false
```

## Terraform State

Local validation keeps the default local backend so `terraform plan` can run
without AWS state access. The GitHub Actions workflows generate
`infra/envs/dev/backend.generated.tf` at runtime and initialize the S3 backend
with:

- bucket: `young-certi-dev-${AWS_ACCOUNT_ID}-ap-northeast-2-tfstate`
- key: `dev/terraform.tfstate`
- lock: S3 native lockfile via `use_lockfile=true`

The `cluster-up` and `cluster-down` workflows wrap the EKS lifecycle with
manual confirmation strings and always use that same remote state.

## Frontend CDN

The frontend CDN is opt-in so local and CI plans do not create CloudFront by
accident:

```sh
docker compose run --rm tf terraform -chdir=infra/envs/dev plan \
  -var enable_frontend_cdn=true
```

When applied, Terraform outputs `frontend_cors_allowed_origins`. Use that
value as the backend chart's `env.CORS_ALLOWED_ORIGINS` value so the API only
allows browser requests from the CloudFront frontend origin.
