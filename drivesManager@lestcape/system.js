
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

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const St = imports.gi.St;

function CinnamonSpawAsyncProxy() {
   this._init();
}

CinnamonSpawAsyncProxy.prototype = {

   _init: function() {
      let _file;
      try {
        _file = this._getCurrentFile();
      } catch(e) {
         let icon = new St.Icon({ icon_name: 'error',
                               icon_type: St.IconType.FULLCOLOR,
                               icon_size: 36 });
         Main.criticalNotify(_("The communication can't be established:") + e.message, icon);
      }
      this._quickTasks = new Array();
      this.daemonBaseUrl = _file.get_parent().get_path() + "/daemon/";
      this.daemonName = 'cinnamon-spaw-async-daemon';
      GLib.spawn_command_line_async("sh -c 'chmod 755 \""+ this.daemonBaseUrl + this.daemonName + ".js\"'");
   },

   start: function() {
      try {
         this._startDaemon();
         this._beginComunicate();
         return true;
      } catch (e) {
         let icon = new St.Icon({ icon_name: 'error',
                               icon_type: St.IconType.FULLCOLOR,
                               icon_size: 36 });
         Main.criticalNotify(_("The communication can't be established:") + e.message, icon);
      }
      return false;
   },

   stop: function() {
      if(this.proxy) {
         let theResult, theExcp;
         this.proxy.stopRemote(function(result, excp) {
            //theResult = result;
            theExcp = excp;
            Mainloop.quit('stop-GDBus');
            });

        Mainloop.run('stop-GDBus');
        this.proxy = null;
      } else
         Main.notifyError(_("Error:"), _("The communication need to be established first."));
   },

   isRuning: function() {
      return (this.proxy != null);
   },

   spawCommandLineAsync: function(command, callBackMethod) {
      if(this.proxy) {
         callBackIdentifier = new Date().getTime().toString();
         this._quickTasks.push([command, callBackMethod, callBackIdentifier]);
         this.proxy.spawCommandLineRemote(command, callBackIdentifier, Lang.bind(this, this._captureSignal));
      } else
         Main.notifyError(_("Error:"), _("The communication need to be established first."));
   },

   _captureSignal: function(result, excp) {
      if(result)  {
         let task = this._searchTaskByIdentifire(result[0]);
         if(task)
            task[1](task[0], result[1], result[2]);
         else
            Main.notifyError(_("Error:"), _("Can't localizing task."));
      }
      else {
        excp.message = excp.message.replace(/.*\((.+)\)/, '$1');
        Main.notifyError(_("Result is undefined:"), excp.message);
      }
   },
 
   _searchTaskByIdentifire: function(id) {
      let currTask;
      for(taskIndex in this._quickTasks) {
         currTask = this._quickTasks[taskIndex];
         if(currTask[2] == id) {
            this._quickTasks.splice(taskIndex, 1);
            return currTask;
         }
      }
      return null;
   },

   _startDaemon: function() {
      try { 
         let [success, argv] = GLib.shell_parse_argv(this.daemonBaseUrl + this.daemonName + ".js");
         this._trySpawn(argv);
      } catch (e) {
         e.message = _("The communication can't be established:") + e.message;
         throw e;
      }
   },

   _trySpawn: function(argv) {
      try {   
         GLib.spawn_async(null, argv, null,
            GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.STDOUT_TO_DEV_NULL  | GLib.SpawnFlags.STDERR_TO_DEV_NULL,
            null, null);
      } catch (err) {
         if (err.code == GLib.SpawnError.G_SPAWN_ERROR_NOENT) {
            err.message = _("Command not found.");
         } else {
            // The exception from gjs contains an error string like:
            //   Error invoking GLib.spawn_command_line_async: Failed to
            //   execute child process "foo" (No such file or directory)
            // We are only interested in the part in the parentheses. (And
            // we can't pattern match the text, since it gets localized.)
            err.message = err.message.replace(/.*\((.+)\)/, '$1');
         }
         throw err;
      }
   },

   _beginComunicate: function() {
      try {
         let xmlDaemon = eval(GLib.file_get_contents(this.daemonBaseUrl + this.daemonName + '.xml')[1].toString());
         let ProxyClass = Gio.DBusProxy.makeProxyWrapper(xmlDaemon);
         let err;
         this.proxy = new ProxyClass(Gio.DBus.session, 'org.gnome.gjs.spawAsync', '/org/gnome/gjs/spawAsync',
            function (obj, error) {
               err = error;
               this.proxy = obj;
               Mainloop.quit('start-comunications-GDBus');
            });

         Mainloop.run('start-comunications-GDBus');
         if(!this.proxy)
            throw err;

      } catch (e) {
        e.message = e.message.replace(/.*\((.+)\)/, '$1');
        throw e;
      }
   },

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

function System(uuid) {
   this._init(uuid);
}

System.prototype = {

   _init: function(_uuid) {
      this.uuid = _uuid;
      //this.lang = _lang;
      this._initInstaller();
      this._initChecker();
      this._timeout = -1;
      this._commadReading = new Array();
      this.spawProxy = new CinnamonSpawAsyncProxy();
   },

   _initInstaller: function()  {
      this._installer = new Array();
      this._installer["apt-get"] = new Array();
      this._installer["apt-get"]["installerSyntax"] = "apt-get install -y $package$";
      this._installer["yum"] = new Array();
      this._installer["yum"]["installerSyntax"] = "yum -y install  $package$";
      this._installer["zypper"] = new Array();
      this._installer["zypper"]["installerSyntax"] = "zypper --non-interactive install $package$";
      this._installer["pacman"] = new Array();
      this._installer["pacman"]["installerSyntax"] = "pacman --noconfirm --noprogressbar -Sy $package$";
      this._installer["emerge"] = new Array();
      this._installer["emerge"]["installerSyntax"] = "emerge -u $package$";
      this._installer["pkg_add"] = new Array();
      this._installer["pkg_add"]["installerSyntax"] = "pkg_add -r $package$";//Default isn't interactive.
      this._installer["pkgadd"] = new Array();
      this._installer["pkgadd"]["installerSyntax"] = "pkgadd -n $package$";//Solaris
      this._installer["urpmi"] = new Array();
      this._installer["urpmi"]["installerSyntax"] = "urpmi $package$";//Mandrivia
      //slackpkg install pkg //slapt-get --install pkg //netpkg pkg  //equo install pkg
      //conary update pkg //pisi install pkg  //smart install pkg  //pkcon install pkg
      //lin pkg //cast pkg
   },

   _initChecker: function()  {
      this._checker = new Array();
      this._checker["dpkg"] = new Array();
      this._checker["dpkg"]["checkerSyntax"] = "dpkg -s $package$";//Also dpkg -l pmount | grep ^ii
      this._checker["rpm"] = new Array();
      this._checker["rpm"]["checkerSyntax"] = "rpm -qa $package$";
      this._checker["pacman"] = new Array();
      this._checker["pacman"]["checkerSyntax"] = "pacman -Qs $package$";
      this._checker["qpkg"] = new Array();
      this._checker["qpkg"]["checkerSyntax"] = "qlist -I $package$";  //Geentoo
      this._checker["pkg_info"] = new Array();
      this._checker["pkg_info"]["checkerSyntax"] = "pkg_info -x $package$"; //bsd
      this._checker["pkginfo"] = new Array();
      this._checker["pkginfo"]["checkerSyntax"] = "pkginfo -x $package$"; //Solaris
      //slapt-get --installed //netpk list I  //equo list  //conary query //pisi list-installed
      //smart query --installed //lvu installed //gaze installed
   },

   _generateCommand: function(command, packageName)  {
      let _cmdGen = command;
      while(_cmdGen.indexOf("$package$") != -1)
         _cmdGen = _cmdGen.replace("$package$", packageName);
      return _cmdGen;
   },

   _getInstaller: function() {
      for(let _keyInstaller in this._installer) {
         if(GLib.find_program_in_path(_keyInstaller))
            return _keyInstaller;
      }
      let icon = new St.Icon({ icon_name: 'error',
                               icon_type: St.IconType.FULLCOLOR,
                               icon_size: 36 });
      Main.criticalNotify(_("Can't be found appropriate installer program. The Automatic installation can't be performed."), icon);
   },

   _getChecker: function() {
      for(let _keyChecker in this._checker) {
         if(GLib.find_program_in_path(_keyChecker))
            return _keyChecker;
      }
      let icon = new St.Icon({ icon_name: 'error',
                               icon_type: St.IconType.FULLCOLOR,
                               icon_size: 36 });
      Main.criticalNotify(_("Can't be found an appropriate packages check program. The automatic installation cannot be performed."), icon);
   },

   _readCommandLine: function() {
      let _out;
      let _cmdData = 0;
      while(_cmdData < this._commadReading.length) {
         _out = this._readFile(this._commadReading[_cmdData]["fileData"]);
         if(_out) {
            if(this._commadReading[_cmdData]["print"]) {
               this._deleteFile(this._commadReading[_cmdData]["fileData"]);
               this._commadReading[_cmdData]["callBackFunction"](_out);
               this._commadReading.splice(_cmdData, 1);
            } else {
               this._commadReading[_cmdData]["print"] = true;
               _cmdData = _cmdData + 1;
            }
         }
         else
            _cmdData = _cmdData + 1;
      }
      if(this._commadReading.length)
         this._timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._readCommandLine));
      else
         this._timeout = -1;
   },

   _trySpawnAsync: function(argv) {
      try {   
         GLib.spawn_async(null, argv, null,
            GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.STDOUT_TO_DEV_NULL  | GLib.SpawnFlags.STDERR_TO_DEV_NULL,
            null, null);
      } catch (err) {
         if (err.code == GLib.SpawnError.G_SPAWN_ERROR_NOENT) {
            err.message = _("Command not found.");
         } else {
            // The exception from gjs contains an error string like:
            //   Error invoking GLib.spawn_command_line_async: Failed to
            //   execute child process "foo" (No such file or directory)
            // We are only interested in the part in the parentheses. (And
            // we can't pattern match the text, since it gets localized.)
            err.message = err.message.replace(/.*\((.+)\)/, '$1');
         }
         throw err;
      }
   },

   _trySpawnSync: function(argv) {//Not working
      try {           
         let _result = GLib.spawn_sync(null, argv, null,
            GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.STDOUT_TO_DEV_NULL  | GLib.SpawnFlags.STDERR_TO_DEV_NULL,
            null, null);
         //Main.notifyError(_("Error:") + _result[0] + " " + _result[1] + " " + _result[2] + " " + _result[3]); 
         return _result;
      } catch (err) {
         if (err.code == GLib.SpawnError.G_SPAWN_ERROR_NOENT) {
            err.message = _("Command not found.");
         } else {
            // The exception from gjs contains an error string like:
            //   Error invoking GLib.spawn_command_line_async: Failed to
            //   execute child process "foo" (No such file or directory)
            // We are only interested in the part in the parentheses. (And
            // we can't pattern match the text, since it gets localized.)
            err.message = err.message.replace(/.*\((.+)\)/, '$1');
         }
         throw err;
      }
   },
 

   destroy: function()  {
      this.stopProxyCommandLine();
   },

   startProxyCommandLine: function() {
      try {
         if(!this.spawProxy.isRuning())  
            this.spawProxy.start();
      } catch(e) {
         let icon = new St.Icon({ icon_name: 'error',
                               icon_type: St.IconType.FULLCOLOR,
                               icon_size: 36 });
         Main.criticalNotify(_("The communication can't be established:") + e.message, icon);
      }
   },

   stopProxyCommandLine: function()  {
     if(this.spawProxy.isRuning())
        this.spawProxy.stop();
   },

   isProxyRuning: function() {
      return this.spawProxy.isRuning(); 
   },

   findDistroName: function() {
      if(GLib.find_program_in_path('lsb_release')) {
         let [res, out, err, status] = this.execCommandSync('lsb_release -a');
         let _lines = out.toString().split("\n");
         let _pos = 0;
         for(let _currLine in _lines) {
            _pos = _lines[_currLine].indexOf("Distributor ID");
            if(_pos != -1)
               return _lines[_currLine].substring(16, _lines[_currLine].length);
         }
      }
      return "Default";
   },

   getGSettingsProp: function(property, attribute) {
      let [res, out, err, status] = this.execCommandSync('gsettings get ' + property + ' ' + attribute);
      return out.toString().substring(0, out.length - 1);
   },

   setGSettingsProp: function(property, attribute, value) {
      let out = this.getGSettingsProp(property, attribute);
      //Main.notify("Real:" + out.toString() + "/ New:" + value.toString() + "/");
      if(out.toString() != value.toString())
      {
         this.execCommand('gsettings set ' + property + ' ' + attribute + ' ' + value); 
      }
   },

   readFile: function(path) {
      //GLib.file_get_contents(path).toString();
      try {
         let file = Gio.file_new_for_path(path);
         if(file.query_exists(null))
         {
            let fstream = file.read(null);
            let dstream = new Gio.DataInputStream.new(fstream);
            let data = dstream.read_until("", null);
            fstream.close(null);
            return data.toString();
         }
      } catch(e) {
         Main.notifyError(_("Error:"), e.message);
      }
      return null;
   },

   fileExists: function(path) {
      return Gio.file_new_for_path(path).query_exists(null);
   },

   path: function() {
      return GLib.get_home_dir() + "/.local/share/cinnamon/desklets/" + this.uuid + "/";
   },

   deleteFile: function(path) {
      return Gio.file_new_for_path(path).delete(null);
   },

   isDirectory: function(path) {
      try {
         let fDir = Gio.file_new_for_path(path);
         let info = fDir.query_filesystem_info("standard::type", null);
         if((info)&&(info.get_file_type() != Gio.FileType.DIRECTORY))
            return true;
      } catch(e) {
         return false;
      }
   },

   makeDirectoy: function(path) {
      let fDir = Gio.file_new_for_path(path);
      if(!this.isDirectory(path))
         this.makeDirectoy(fDir.get_parent().get_path());
      if(!this.isDirectory(path))
         fDir.make_directory(null);
   },

   getFileSize: function(path) {
      if(this.fileExists(path)) {
         let _attribute = "filesystem::size";
         try {
            let _file = Gio.file_new_for_path(path);
            return _file.query_filesystem_info(_attribute, null).get_attribute_uint64(_attribute);
         } catch(e) {
            return 0;
         }
      }
      return 0;
   },

   equalsFile: function(path1, path2) {
      let fSize1 = this.getFileSize(path1);
      let fSize2 = this.getFileSize(path2);
      return ((fSize1 != 0)&&(fSize1 == fSize2));
   },

   writeComandLine: function(command, callBackFunction) {
      this._writeFileComandLine(command, new Date().getTime(), callBackFunction);
   },

   writeFileComandLine: function(command, fileName, callBackFunction) {
      try {
         let _pathFile = this._path() + fileName;
         let _inProcess = false;
         for(let cmdData in this._commadReadingfileName) {
            if(this._commadReadingfileName[cmdData]["fileData"] == _pathFile) {
               _inProcess = true;
               break;
            }
         }
         if(!_inProcess) {
            this.execCommand("sh -c '" + command + " > " + _pathFile + "'");
            let _cmdData = new Array();
            _cmdData["callBackFunction"] = callBackFunction;
            _cmdData["fileData"] = _pathFile;
            _cmdData["print"] = false;
            this._commadReading.push(_cmdData);
            if(this._timeout <= 0)
               this._readCommandLine();
         }
      } catch(e) {
         Main.notifyError(_("Error:"), e.message);
      }
   },

   execInstallLanguage: function() {
      let _localeFolder = Gio.file_new_for_path(GLib.get_home_dir() + "/.local/share/locale/");
      let _moFolder = Gio.file_new_for_path(this.path() + "locale/");

      let children = _moFolder.enumerate_children('standard::name,standard::type',
                                          Gio.FileQueryInfoFlags.NONE, null);
      let info, child, _moFile, _moLocale, _noPath;
      while ((info = children.next_file(null)) != null) {
         let type = info.get_file_type();
         if (type == Gio.FileType.REGULAR) {
            _moFile = info.get_name();
            if (_moFile.substring(_moFile.lastIndexOf(".")) == ".mo") {
               _moLocale = _moFile.substring(0, _moFile.lastIndexOf("."));
               _moPath = _localeFolder.get_path() + "/" + _moLocale + "/LC_MESSAGES/";
               let src = Gio.file_new_for_path(String(_moFolder.get_path() + "/" + _moFile));
               let dest = Gio.file_new_for_path(String(_moPath + this.uuid + ".mo"));
               try {
                  if(!this.equalsFile(dest.get_path(), src.get_path())) {
                     this.makeDirectoy(dest.get_parent().get_path());
                     src.copy(dest, Gio.FileCopyFlags.OVERWRITE, null, null);
                  }
               } catch(e) {
                 Main.notify(_("Error:"), e.message);
               }
            }
         }
      }
   },

   execCommandAsRoot: function(command) {
      if(GLib.find_program_in_path("pkexec")) {
         return this.execCommand("sh -c 'pkexec sh -c \"" + command + "\"'");
      }
      else if(GLib.find_program_in_path("gksu")) {
         return this.execCommand("gksu \"sh -c '" + command + "'\"");
      }
      else if(GLib.find_program_in_path("kdesu")) {
         return this.execCommand("kdesu -c \"sh -c '" + command + "'\"");
      }
      else {
         let icon = new St.Icon({ icon_name: 'error',
                                  icon_type: St.IconType.FULLCOLOR,
                                  icon_size: 36 });
         Main.criticalNotify(_("You don't have any GUI program to get root permissions."), icon);
      }
      return false;
   },

   execCommand: function(command) {
      try {
         let [success, argv] = GLib.shell_parse_argv(command);
         this._trySpawnAsync(argv);
         return true;
      } catch (e) {
         let title = _("Execution of '%s' failed:").format(command);
         Main.notifyError(title, e.message);
      }
      return false;
   },

   execCommandSync: function(command) {
      try {
         /*let [success, argv] = GLib.shell_parse_argv(command);
         return this._trySpawnSync(argv);*/
         return GLib.spawn_command_line_sync(command);
      } catch (e) {
         let title = _("Execution of '%s' failed:").format(command);
         Main.notifyError(title, e.message);
      }
      return null;
   },

   execCommandAsync: function(command, callBackMethod) {
      if(this.spawProxy.isRuning())
         this.spawProxy.spawCommandLineAsync(command, callBackMethod);
      else {
         let title = _("Execution of '%s' failed:").format(command);
         Main.notifyError(_("The communication can't be established:"), title);
      }
   },

   execInstall: function(packageName) {
      let _bestInstaller = this._getInstaller();
      if(_bestInstaller) {
         let _cmd = this._generateCommand(this._installer[_bestInstaller]["installerSyntax"], packageName);
         Main.notifyError(_cmd);
         return this.execCommandAsRoot(_cmd);
      }
      return false;
   },

   execChmod: function(folder, permissions) {
      let _cmd = "chown root:root \"" + folder +"\" && chmod " + permissions + " \""+ folder+"\"";
      Main.notifyError(_cmd);
      return this.execCommandAsRoot(_cmd);
   },

   isProgramInstall: function(programName) {
      return (GLib.find_program_in_path(programName) != null);
   },

   pathToProgram: function(programName) {
      return GLib.find_program_in_path(programName);
   },

   isPackageInstall: function(packageName) {
      let _bestChecker = this._getChecker();
      if(_bestChecker) {
         let _cmd = this._generateCommand(this._checker[_bestChecker]["checkerSyntax"], packageName);
         let [res, out, err, status] = this.execCommandSync(_cmd);
         //Main.notifyError(_("Error:") + err.toString() + " status:" + status.toString() + " res: " + res.toString());
         if((!status)&&(out.toString().indexOf(packageName) != -1))
            return true;
      }
      return false;      
   },

   havePermission: function(folder, permissionNeeded) {
      let [res, out, err, status] = this.execCommandSync('ls -l ' + folder);
      let out_lines = out.toString().split(" ");
      return out_lines[0] == permissionNeeded;
   }

/*
   print_device: function(device) {
      if(device.get_name() == "sr0") {
         let info = "";
         info = info + "initialized:            " + device.get_is_initialized() + "\n";
         info = info + "usec since initialized: " + device.get_usec_since_initialized() + "\n";
         info = info + "subsystem:              " + device.get_subsystem() + "\n";
         info = info + "devtype:                " + device.get_devtype() + "\n";
         info = info + "name:                   " + device.get_name() + "\n";
         info = info + "number:                 " + device.get_number() + "\n";
         info = info + "sysfs_path:             " + device.get_sysfs_path() + "\n";
         info = info + "driver:                 " + device.get_driver() + "\n";
         info = info + "action:                 " + device.get_action() + "\n";
         info = info + "seqnum:                 " + device.get_seqnum() + "\n";
         info = info + "device type:            " + device.get_device_type() + "\n";
         info = info + "device number:          " + device.get_device_number() + "\n";
         info = info + "device file:            " + device.get_device_file() + "\n";
         info = info + "device file symlinks:   " + device.get_device_file_symlinks() + "\n";
         info = info + "tags:                   " + device.get_tags() + "\n";
         let keys = device.get_property_keys();
         for(let n = 0; n < keys.length; n++) {
            info = info + "    " + keys[n] + "=" + device.get_property(keys[n]) + "\n";
         }
         this.write_to_file(info);
      }
   },
        
   write_to_file: function (text_line) {
      try {
         let output_file = Gio.file_new_for_path("/home/lester/.local/share/cinnamon/desklets/drivesManager@lestcape/temp.txt");
         let fstream = output_file.replace("", false, Gio.FileCreateFlags.NONE, null);
         let dstream = new Gio.DataOutputStream.new(fstream);   

         dstream.put_string(text_line, null);
         fstream.close(null);
      } catch(e) {
         Main.notifyError(_("Failed of Drives Manager:"), e.message);
      }
   },

   print_all_device: function() {
      try {
         let client = new GUdev.Client({subsystems: []});
         let enumerator = new GUdev.Enumerator({client: client});
         enumerator.add_match_subsystem('b*');

         let devices = enumerator.execute();

         for(let n=0; n < devices.length; n++) {
            let device = devices[n];
            this.print_device(device);
         }
      } catch(e) {
         Main.notifyError(_("Failed of Drives Manager:"), e.message);
      }
   },
*/
};
