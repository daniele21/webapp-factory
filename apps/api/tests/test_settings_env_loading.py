import os
import tempfile
import importlib


def test_loads_env_file_by_envname(monkeypatch, tmp_path):
    # create a temporary .env.test file
    env_file = tmp_path / ".env.test"
    env_file.write_text("APP_GOOGLE_CLIENT_ID=env-file-client-id\nAPP_GOOGLE_CLIENT_SECRET=env-file-secret\n")

    # ensure environment points to test env
    monkeypatch.setenv("APP_ENV", "test")

    # place the file in the apps/api directory (where settings expects it)
    target = os.path.join(os.getcwd(), "apps", "api", ".env.test")
    with open(target, "w") as f:
        f.write(env_file.read_text())

    # reload settings module to pick up new env file
    if "apps.api.settings" in importlib.sys.modules:
        importlib.reload(importlib.import_module("apps.api.settings"))
    settings_mod = importlib.import_module("apps.api.settings")
    settings = settings_mod.settings

    assert settings.GOOGLE_CLIENT_ID == "env-file-client-id"
    assert settings.GOOGLE_CLIENT_SECRET == "env-file-secret"

    # cleanup
    os.remove(target)
