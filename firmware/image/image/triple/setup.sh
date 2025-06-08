#!/bin/bash

set -eu

LABEL="$1"
BOOTUUID="${2:0:4}-${2:4:4}"
ROOTUUID="$3"
DATAUUID="$4"

echo "setup.sh"

case $LABEL in
   ROOT)
      cat << EOF > $IMAGEMOUNTPATH/etc/fstab
UUID=${ROOTUUID} /               ext4 rw,relatime,errors=remount-ro 0 1
EOF

      cat << EOF >> $IMAGEMOUNTPATH/etc/fstab
UUID=${DATAUUID} /mnt            ext4 rw,relatime,errors=remount-ro 0 1
EOF

      cat << EOF >> $IMAGEMOUNTPATH/etc/fstab
UUID=${BOOTUUID^^} /boot/firmware  vfat rw,noatime,fmask=0022,dmask=0022,codepage=437,iocharset=ascii,shortname=mixed,errors=remount-ro 0 2
#UUID=${BOOTUUID^^} /boot/firmware  vfat ro,noatime,fmask=0022,dmask=0022,codepage=437,iocharset=ascii,shortname=mixed,errors=remount-ro 0 2
EOF
      
      cp $IMAGEMOUNTPATH/etc/fstab $OUTPUTPATH
      ;;
   BOOT)
      sed -i "s|root=\([^ ]*\)|root=UUID=${ROOTUUID} overlayroot=tmpfs:recurse=0 quiet|" $IMAGEMOUNTPATH/cmdline.txt
      ;;
   *)
      ;;
esac
