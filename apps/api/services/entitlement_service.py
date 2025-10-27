FEATURES = {
    "dashboard.view": {"plans": ["free", "pro", "enterprise"]},
    "reports.generate": {"plans": ["pro", "enterprise"]},
}

def has_feature(plan: str, feature: str) -> bool:
    f = FEATURES.get(feature)
    return bool(f and plan in f["plans"])
