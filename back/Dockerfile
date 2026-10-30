FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Utilisateur non-root + dossiers inscriptibles pour les volumes
RUN chmod +x entrypoint.sh \
    && adduser --disabled-password --gecos "" appuser \
    && mkdir -p /app/staticfiles /app/mediafiles \
    && chown -R appuser /app/staticfiles /app/mediafiles
USER appuser

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "cms_back.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]