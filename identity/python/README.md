# kernaq-identity

Official Python SDK for the [Kernaq Identity API](https://kernaq.com).

Synchronous KYC pipeline — document OCR, face match, and liveness detection in a single call. Process-and-forget: nothing is stored on Kernaq servers.

## Install

```bash
pip install kernaq-identity
```

## Quick start

```python
from kernaq import Kernaq

client = Kernaq()  # reads KERNAQ_API_KEY from env

# Full KYC pipeline
result = client.verify.run(
    document=open("id.jpg", "rb"),
    selfie=open("selfie.jpg", "rb"),
    video=open("liveness.mp4", "rb"),
    document_type="national_id",
    country="KEN",
)
print(result.verdict)                   # "pass" | "fail" | "review"
print(result.score)                     # 0-100
print(result.face_match)                # True
print(result.document_fields.name)

# Sandbox mode (no billing) — use k_test_ keys
result = client.verify.sandbox(document=..., selfie=..., video=...)

# Standalone OCR
fields = client.documents.extract(document=open("id.jpg", "rb"))
print(fields.document_number)

# Face match
match = client.face.match(
    face_a=open("doc.jpg", "rb"),
    face_b=open("selfie.jpg", "rb"),
)
print(match.matched, match.confidence)

# Liveness
live = client.liveness.check(video=open("clip.mp4", "rb"))
print(live.is_live, live.confidence)

# Usage stats
stats = client.usage.get(days=30)
print(stats.total_calls)
```

## API key

Get your key from the [Kernaq dashboard](https://kernaq.com/dashboard).

```bash
export KERNAQ_API_KEY="k_live_..."
```

Or pass it directly:

```python
client = Kernaq(api_key="k_live_...")
```

## Links

- [Documentation](https://kernaq.com/docs)
- [GitHub](https://github.com/Kernaq/SDKs)
