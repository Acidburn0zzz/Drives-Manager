Cinnamon Desklet: Drives Manager Version: v1.6

Last version release date: 31 May 2015.

Contact: lestcape@gmail.com  Website: https://github.com/lestcape/Drives-Manager
***

![Alt text](/drivesManager@lestcape/Capture.png)

--------------
Authors:
--------------
   [Lester Carballo Pérez](https://github.com/lestcape)

--------------
Special thanks to:
--------------
 - [mtwebster](https://github.com/mtwebster) Included the translation support on cinnamon.
 - [rgcjonas](https://github.com/rgcjonas) Udisk2 asyncronous temperature detections.
 - [collinss](https://github.com/collinss) The raise desklet behavior.

--------------
Author of language translation:
--------------
 - Bulgarian(Bg):    [Peyu Yovev (spacy01)](https://github.com/spacy01) (spacy00001@gmail.com) )
 - Czech(Cs_Cz):     [Kuba Vaněk]() (vanek.jakub4@seznam.cz)
 - Spanish(Es):      [Lester Carballo Pérez](https://github.com/lestcape) (lestcape@gmail.com)
 - English(En):      [Lester Carballo Pérez](https://github.com/lestcape) (lestcape@gmail.com)

Skills including:
--------------
1. Show different volumes containing a device, also if is not currently mounted.
2. The volumes can be mounted and unmounted with a single click.
3. If you have data volumes mounted, you can access the mount point with your favorite browser (Nemo or Nautilus) with a single click or automatically if desired when the volume is mounted.
4. The desklet has a wide range of configuration options, allowing you to fit almost all themes desk.
5. Through this desklet, you can monitor the temperatures of your hard disks and even activate an alarm when the disc temperature exceeds a value, that you consider unacceptable. To use this option, we required udisk2.
6. You can enable the option to reconnect removable usb device, without the need to remove the device from the connector. Like USB Safely Removed works in Windows.
7. You can also monitor the speed of read/write files on your system.
8. This extension can be a Desklet and also an Applet.

This program is free software:
--------------
You can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.


Installation Instructions:
--------------
1. Download this desklet from their website : https://github.com/lestcape/Drives-Manager
2. Unzip the downloaded file and copy the folder drivesManager@lestcape at /home/USERNAME/.local/share/cinnamon/desklets/ where USER is the user for your operating system.
3. Enable the desklet in Cinnamon Settings and use it.


Add new languages:
--------------
1. Install the poedit program.
2. Open the file default.po with poedit. This file is located in the folder /drivesManager@lestcape/locale/po
3. Make the translation, save the result, and send the .po file updated by the e-mail address here present, or add directly into the website of this software.

Known bugs and requirements:
--------------
1. Warning! To use the temperature detection you need to have installed udisks2. The data of hdd temperature are obtained directly from udisks2. So you need ubuntu 12.10 or higher or an equivalent that come or allow install udisks2.

2. Be careful! When a removable device has more than one partition and is active the option to reconnect the device without removing from the connector. Can happen that you unplugged a device that have some partitions mounted and therefore you can lose some important data, so i fully recommend activate the option "Unmount all mounted belonging to the same drive". By default it's active.

Change Log:
==============
1.6
   - Added support for cinnamon 2.6.
   - Was extended the symbolic option to all icons inside the manager.

1.5
   - Added the missing instance_id parameter that prevent remember the settings.
   - Now when the applet will be removed and the desklet it's currently shown as an applet, also will be removed the desklet from the desktop.

1.4
   - Added Bulgarian language, thanks to Peyu Yovev

1.3
  - Drives Manager automount the volumes.
  - Fixed the fix width and height on the Cinnamon restart.

1.2-RTM
  - All icons are in svg now.
  - Added Czech language(thanks vanek.jakub4).
  - The hddtemp program was replaced by Udisk2(thanks rgcjonas).
  - Added Cinnamon theme support.
  - Now we can choose whether Drives Manager will be presented as an Applet or Desklet.
  - Mount points can opened now with the default browser of your computer.
  - The height is limited to not exceed the height of the monitor with an scroll box.
  - Was added options to configure the behavior of the scroll box.
  - Removed the option to open mount points with nautilus or nemo. Instead will open with the default browser.
  - It was added an option to unmount all volumes simultaneously (to avoid data loss due to human errors).
  - Images from measurement were replaced by an internal implementation. The flickers finished and now it is configurable from css.
  - Reimplemented the automount-open, to be used the new GSettings for Cinnamon (Nemo) and also read the GSettings for Gnome nautilus.
  - Added missing category from volumes without drives (like ftp, sftp, iso images and more).
  - Decreased the CPU usage to the minimum.
  - Added Hotkey to raise or open the Desklet/Applet(thanks collins).
  - Removed the special handling of CDROM drives, because cause many conflicts and problems.
  - The settings has improved and now is organised by categories.

1.1-RTM
  - Added parameter, was missing in CriticalNotify .
  - The gjs daemon for obtain temp with hddtemp was removed, depend of gjs, and maybe it's not installed, was replaced by spaw with pipes.

1.0-RTM
  - Everything has been reimplemented. Now the execution of desklet, don't delays the main thread of Cinnamon. The code was optimized to use less CPU.
  - Internally we support several alternative programs for tasks that require elevated privileges like: pkexec, gksu or kdesu.
  - Was added a tool for measuring the speed of read/write disks.
  - Now you can see the temperature of hard drives, thanks to the inclusion of support for hddtemp.
  - Was added language support and then was updated to Cinnamon 2.0, by the standard mechanism implemented in Cinnamon.
  - Added the Spanish language.
  - You can configure how long of delay in the processing intervals and how you like consume the CPU resource in your computer. It's can do if you active or deactive some option.
  - You can now reconnect the removable devices without removing them from its connector.
  - Added support to recognize devices that have more than one volume.
  - Fixed some minor issues.

0.1-Beta
   - Initial release.

==============
To report problems, request new features, for include a new icons pack​​, languages, or anything you want in the desklet, visit:
https://github.com/lestcape/Drives-Manager/issues

==============
Thank you very much for using this product.
Lester.

