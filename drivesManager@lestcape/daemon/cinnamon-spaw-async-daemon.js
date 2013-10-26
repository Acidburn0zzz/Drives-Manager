
// Desklet : Drives Manager         Version      : v1.0-RTM
// O.S.    : Cinnamon               Release Date : 25 October 2013.
// Author  : Lester Carballo Pérez  Email        : lestcape@gmail.com
//
// Website : https://github.com/lestcape/Drives-Manager
//
// This is a desklet to show devices connected to the computer and interact with them.
//
// Skills including:
//
// 1- Show different volumes containing a device, also if is not currently mounted.
// 2- The volumes can be mounted and unmounted with a single click.
// 3- If you have data volumes mounted, you can access the mount point with your favorite
//    browser (Nemo or Nautilus) with a single click or automatically if desired when the
//    volume is mounted.
// 4- The desklet has a wide range of configuration options, allowing you to fit almost all
//    themes desk.
// 5- Through this desklet, you can monitor the temperatures of your hard disks and even
//    activate an alarm when the disc temperature exceeds a value, that you consider unacceptable.
//    To use this option, we required the installation and configuration of hddtemp program,
//    but do not worry, simply activate the option and the desklet will installed and configured,
//    without your intervention.
// 6- You can enable the option to reconnect removable usb device, without the need to remove the
//    device from the connector. Like USB Safely Removed works in Windows.
// 7- You can also monitor the speed of read/write files on your system.
// 8- If you have a CD-ROM disc tray, you can opened/closed it with a single click, even if a
//    disc is present. Unfortunately, this skill requires that you have installed eject and
//    cdrecord programs.
//
//    This program is free software:
//
//    You can redistribute it and/or modify it under the terms of the
//    GNU General Public License as published by the Free Software
//    Foundation, either version 3 of the License, or (at your option)
//    any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.

#!/usr/bin/gjs

const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;


function DrivesManagerDaemon() {
   this._init();
}

DrivesManagerDaemon.prototype = {

   _init: function() {
      let file;
      try {
        file = this._getCurrentFile();
      } catch(e) {
        print("error", e.message);
      }
      let nameF = file.get_basename();

      this.daemonBaseUrl = file.get_parent().get_path() + "/";
      this.daemonName = nameF.substring(0, nameF.lastIndexOf("."));
      let xmlDaemon = eval(GLib.file_get_contents(this.daemonBaseUrl + this.daemonName + '.xml')[1].toString());
      this._impl = Gio.DBusExportedObject.wrapJSObject(xmlDaemon, this);
      this._impl.export(Gio.DBus.session, '/org/gnome/gjs/spawAsync');

      
   },

   start: function() {
      this.own_name_id = Gio.DBus.session.own_name('org.gnome.gjs.spawAsync', Gio.BusNameOwnerFlags.NONE,
          function(name) {
             log("Acquired name " + name);
             //print("Acquired name " + name);
             //Mainloop.quit('spaw-async-daemon');
          },
          function(name) {
             log("Lost name " + name);
             //Mainloop.quit('spaw-async-daemon');
             //print("Lost name " + name);
          });

      Mainloop.run('spaw-async-daemon');
   },

   spawCommandLine: function(command, callBackIdentifier) {
      //let [success, argv] = GLib.shell_parse_argv(command);
      let [res, out, err, status] = GLib.spawn_command_line_sync(command); 
      if(res)
        return [ callBackIdentifier, res, out.toString() ];
      else
        return [ callBackIdentifier, res, err.toString() ];
   },

   stop: function() {
      Mainloop.quit('spaw-async-daemon');
      Gio.DBus.session.unown_name(this.own_name_id);
   },

//Local Method

   _getCurrentFile: function() {
      let stack = (new Error()).stack;

      let stackLine = stack.split('\n')[1];
      if (!stackLine)
         throw new Error('Could not find current file');

      let match = new RegExp('@(.+):\\d+').exec(stackLine);
      if (!match)
         throw new Error('Could not find current file');

      let path = match[1];
      return Gio.File.new_for_path(path);
   }
};

try {
  let daemon = new DrivesManagerDaemon();
  daemon.start();
} catch(e) {
  print(e.message);
}



