from pathlib import Path


def contract_path() -> Path:
    return Path("/workspace/specs/001-question-practice/contracts/openapi.yaml")


def render_openapi() -> str:
    return contract_path().read_text()


def main() -> None:
    print(render_openapi(), end="")


if __name__ == "__main__":
    main()

