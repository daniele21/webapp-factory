from google.cloud import firestore
from ..settings import settings

def client():
    return firestore.Client(project=settings.project_id)
