Drives-Manager v1.1-RTM
==============

Desklet: Drives Manager Version: v1.1-RTM

O.S.: Cinnamon 

Release Date: 30 October 2013

Author: Lester Carballo Pérez

Email: lestcape@gmail.com

Special thanks to:

    The Cinnamon programmers.
    mtwebster in http://cinnamon-spices.linuxmint.com/users/view/339
    KZom in https://github.com/KZom
    duncannz in https://github.com/duncannz
    nimdahk in https://github.com/nimdahk


Website: https://github.com/lestcape/Drives-Manager

--------------

This is a desklet to show devices connected to the computer and interact with them.

![Alt text](/drivesManager@lestcape/Capture.png)


Skills including:
--------------

1.	Show different volumes containing a device, also if is not currently mounted.

2.	The volumes can be mounted and unmounted with a single click.

3.	If you have data volumes mounted, you can access the mount point with your favorite browser (Nemo or Nautilus) with a single click or automatically if desired when the volume is mounted.

4.	The desklet has a wide range of configuration options, allowing you to fit almost all themes desk.

5.	Through this desklet, you can monitor the temperatures of your hard disks and even activate an alarm when the disc temperature exceeds a value, that you consider unacceptable. To use this option, we required the installation and configuration of hddtemp program, but do not worry, simply activate the option and the desklet will installed and configured, without your intervention.

6.	You can enable the option to reconnect removable usb device, without the need to remove the device from the connector. Like USB Safely Removed works in Windows.

7.	You can also monitor the speed of read/write files on your system.

8.	If you have a CD-ROM disc tray, you can opened/closed it with a single click, even if a disc is present (Unfortunately, this skill requires that you have installed eject and cdrecord programs).

This applet not longer has support for Arch Linux.
--------------
The comunity of Arch Linux do not want that I or other Cinnamon developer, publish about Cinnamon, and receive the users feedback (necessary on the developing any app). When the comunity of Arch Linux, want to be open to the free software world, sure that I want to support Arch Linux again...


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
1. Warning! To use this desklet needs you have installed the following programs:
 - gksu, kdesu or pkexec.
 - cdrecord.
 - eject.
 - A plain text editor either.
 - hddtemp (optional).

2. The data of hddtemp not was obtained directly in the Cinnamon thread processing, because it blocked by a few milliseconds the desktop. A new theme is launched to perform this task, outside the context of the implementation of cinnamon, only if this option is required and for the time being.

3. Only we can detect optical disks a CD/DVD, if to devices are recognized by the Linux kernel matching with the regular expresions "dev/sr[0-9] +",  "/dev/cdrom[0-9]+", "/dev/cdrom", "/dev/scd[0-9]+" and "/dev/hdc". If you have a handle to a different optical device, please report it on the website of this program, and this will be included in the next version.

4. The option of auto-open mount points can give many problems, it's because the known incompatibility between Nautilus and Nemo. Any incident, please report it on the website of this desklet.

5. Be careful! When a removable device has more than one partition and is active the option to reconnect the device, this without removing them from the connector. It can be happen that in a negligence, you unplugged a device that have some partitions mounted yet and therefore you can lose some importan data.

Change Log:
==============
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

