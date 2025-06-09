# Bergcam Webserver Software

The Ansible playbook automatically installs the webserver. A systemd service is running `ingestor.py` which receives images from the camera via a WireGuard tunnel. It writes the images as `webp` to `/var/www/bergcam/captures` (with overlay) and to `/opt/archive` (without overlay). nginx is serving the web frontend as well as the capture images from `/var/www/bergcam`.

# Installation
## Requirements & Preparations
Use a fresh Debian 12 machine. It needs around 40GB of storage per week of image capturing. Setup a user with access to `sudo`. Ensure, that the system time is synchronized (e.g., via NTP) and timedatectl should be set to the timezone of the camera (so that images are stored with the correct timestamp).

Change the connection settings in the file `inventory/hosts`. Run the frontend build instructions before running this playbook, since it copies the generated files.

## Run the Ansible Playbook
```bash
cd server
ansible-playbook --ask-become-pass --ask-pass playbook.yml
```

The frontend will be available at port 80, continue to configure the webserver (`/etc/sites-available/bergcam`) or use a reverse proxy in front of it.
The Ansible playbook will copy the WireGuard keys `camera.private` and `server.public` to the controller host. They are used to create the camera firmware.

Use the following command to update the frontend web files (e.g., after running the frontend build):
```bash
ansible-playbook --ask-become-pass --ask-pass update_frontend.yml
```
