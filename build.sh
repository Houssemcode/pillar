#!/usr/bin/env bash
# Exit on error
set -o errexit

if [ -d "backend" ]; then
  cd backend
fi

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
