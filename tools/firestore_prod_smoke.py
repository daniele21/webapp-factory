"""Quick smoke test for Firestore client used in CI or local checks.

This script may be executed directly (e.g. `python tools/firestore_prod_smoke.py`).
Some repository import paths expect the project root and `apps/api` to be on
`sys.path`. If the environment running the script doesn't set PYTHONPATH, add
the necessary paths at runtime so imports succeed.
"""

import os
import sys
from pathlib import Path
import argparse

# Ensure repo root and apps/api are on sys.path so `from config...` imports
# resolve even when PYTHONPATH isn't set externally.
REPO_ROOT = Path(__file__).resolve().parents[1]
APPS_API = REPO_ROOT / 'apps' / 'api'
for p in (str(REPO_ROOT), str(APPS_API)):
    if p not in sys.path:
        sys.path.insert(0, p)

from apps.api.providers import firestore as fs_provider


def smoke_test():
    try:
        client = fs_provider.get_firestore_client()
        print("Connected Firestore client project:", getattr(client, "project", None))
        # Try to log the database id; different client versions expose this differently
        dbid = getattr(client, "database", None) or getattr(client, "_database", None)
        if not dbid:
            # older/newer clients may put it in _client_info or _properties
            dbid = getattr(getattr(client, '_client_info', {}), 'database', None) if hasattr(client, '_client_info') else None
        print("Connected Firestore database:", dbid)

        col = client.collection("smoke_test_docs")
        doc = col.document("smoke-doc")
        print("Writing test document...")
        doc.set({"status": "ok", "source": "smoke_test"})
        got = doc.get()
        print("Document exists:", got.exists)
        print("Document data:", got.to_dict())
        if not getattr(smoke_test, 'keep_doc', False):
            print("Cleaning up...")
            doc.delete()
            print("Done")
        else:
            print("Leaving test document in place for inspection")
    except Exception as e:
        print("Error during Firestore smoke test:", type(e).__name__, str(e))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Firestore smoke test')
    parser.add_argument('--keep', action='store_true', help='Do not delete the test document')
    args = parser.parse_args()
    setattr(smoke_test, 'keep_doc', args.keep)
    smoke_test()
