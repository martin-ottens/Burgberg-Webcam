#!/bin/sh

set -eu

rootfs=$1
genimg_in=$2

echo "pre-image.sh"

cp ./device/provisionmap.json ${IGconf_sys_outputdir}/provisionmap.json

echo "BOOT_UUID=\"$(uuidgen | sed 's/-.*//')"\" > ${genimg_in}/fs_uuids
echo "ROOT_UUID=\"$(uuidgen)"\" >> ${genimg_in}/fs_uuids
echo "DATA_UUID=\"$(uuidgen)"\" >> ${genimg_in}/fs_uuids
. ${genimg_in}/fs_uuids


cat genimage.cfg.in | sed \
   -e "s|<IMAGE_DIR>|$IGconf_sys_outputdir|g" \
   -e "s|<IMAGE_NAME>|$IGconf_image_name|g" \
   -e "s|<IMAGE_SUFFIX>|$IGconf_image_suffix|g" \
   -e "s|<FW_SIZE>|$IGconf_image_boot_part_size|g" \
   -e "s|<ROOT_SIZE>|$IGconf_image_root_part_size|g" \
   -e "s|<DATA_SIZE>|$IGconf_image_data_part_size|g" \
   -e "s|<SECTOR_SIZE>|$IGconf_device_sector_size|g" \
   -e "s|<SETUP>|'$(readlink -ef setup.sh)'|g" \
   -e "s|<MKE2FSCONF>|'$(readlink -ef mke2fs.conf)'|g" \
   -e "s|<BOOT_UUID>|$BOOT_UUID|g" \
   -e "s|<ROOT_UUID>|$ROOT_UUID|g" \
   -e "s|<DATA_UUID>|$DATA_UUID|g" \
   > ${genimg_in}/genimage.cfg
