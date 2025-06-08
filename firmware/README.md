# Bergcam Camera Firmware

## Requirements
- Raspberry Pi 5
- SD Card >= 4GB
- Raspberry Pi HQ Camera (IMX477 sensor) connected to one of the CSI ports
- Connection to Internet will be handled via WiFi

## Config
Change the following files:
- `image/options`: Select a password and a hostname, leave the user as **camera**.
- `files/camera/cameraconfig.json`: Select the settings for the capture programm
- `files/network/wifi.nmconnection`: Setup your Wifi connection
- `files/network/wireguard.nmconnection`: Setup the WireGuard tunnel by adding the peer address and insert the public key of the server as well as the private key of this peer

The files `cameraconfig.json`, `wifi.nmconnection`, `wireguard.nmconnection` are copied to an extra partition (`DATA`), which is mounted writeable to `/mnt` during runtime. Therefore, it is possible to change this setting during runtime or by mounting this partition.

## Build
Run `git submodule update --init` and follow the instructions in [rpi-image-gen/README.md]() to install rpi-image-gen. You should run the build on an ARM system running Raspberry Pi OS.

To build the image, run:
```bash
./rpi-image-gen/build.sh -D image/. -c bergcam-camera -o image/options
```

The image will be deployed to `rpi-image-gen/work/bergcam-camera/deploy/bergcam-camera.img` and is flashed to an SD card, e.g., using the Raspberry Pi Imager.
The size of the `DATA` partition will be expanded to use all available space of the SD card during first boot. The `ROOT` partition is mounted read-only using an *overlayfs*.