from typing import Protocol


class Ledger(Protocol):
    async def submit(self, identity: str, contract: str, transaction: str, arguments: list[str]) -> dict: ...
    async def evaluate(
        self, identity: str, contract: str, transaction: str, arguments: list[str]
    ) -> dict: ...


class ObjectStorage(Protocol):
    async def put_private(self, key: str, data: bytes, content_type: str) -> str: ...


class IdentityProvider(Protocol):
    async def verify(self, token: str) -> dict: ...


class UnconfiguredFabric:
    async def submit(self, *args, **kwargs):
        raise RuntimeError("Fabric gateway is not configured; refusing production write")

    async def evaluate(self, *args, **kwargs):
        raise RuntimeError("Fabric gateway is not configured; refusing fabricated read")
