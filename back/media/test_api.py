import io

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image


def _png():
    buf = io.BytesIO()
    Image.new("RGB", (1, 1)).save(buf, "PNG")
    return SimpleUploadedFile("a.png", buf.getvalue(), content_type="image/png")


def test_media_upload_and_delete(editor_client, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    r = editor_client.post("/api/v1/media/", {"file": _png(), "alt_text": "x"}, format="multipart")
    assert r.status_code == 201
    assert editor_client.delete(f"/api/v1/media/{r.data['id']}/").status_code == 204