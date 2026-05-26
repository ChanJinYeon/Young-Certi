output "vpc_id" {
  description = "VPC ID."
  value       = try(aws_vpc.this[0].id, null)
}

output "public_subnet_ids" {
  description = "Public subnet IDs for EKS nodes and public load balancers."
  value       = values(aws_subnet.public)[*].id
}

output "public_subnet_azs" {
  description = "Availability zones used by the public subnets."
  value       = keys(var.public_subnets)
}
