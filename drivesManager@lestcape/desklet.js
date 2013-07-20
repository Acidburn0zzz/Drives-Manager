
// A Drives Manager Desklet for Cinnamon - v0.1-Beta 28 June 2013.
// Author: Lester Carballo Pérez lestcape@gmail.com
//
// This is a desklet to display the current drives plugged to the computer. 
// We can used the ability to show the volumens of the drive, also indicate
// if the volumen is mounted. When plugged a removable volumen, you can
// mount and unmount the volumen. If the volumen is mount, you can access 
// directly with left click in to the icon of drive. The configuration for
// all option it is in shema format, and is accesible for the cinnamon
// settings, or directly with right click in the desklet.
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.

const Gio = imports.gi.Gio;
const St = imports.gi.St;

const Desklet = imports.ui.desklet;

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Settings = imports.ui.settings;
const Tweener = imports.ui.tweener;
const CinnamonMountOperation = imports.ui.cinnamonMountOperation;
const Main = imports.ui.main;
const Cinnamon = imports.gi.Cinnamon;
//const GUdev = imports.gi.GUdev;

/****Import File****/
//const AppletDir = imports.ui.appletManager.applets['drivesManager@lestcape'];
const DeskletDir = imports.ui.deskletManager.desklets['drivesManager@lestcape'];
const Translate = DeskletDir.translate;
/****Import File****/

function MyDesklet(metadata){
    this._init(metadata);
}

MyDesklet.prototype = {

	__proto__: Desklet.Desklet.prototype,

	_init: function(metadata){
	   Desklet.Desklet.prototype._init.call(this, metadata);
	   this.metadata = metadata;
       	   this.uuid = this.metadata["uuid"];

	   this.setHeader(_("Drives Manager"));

           let translator = new Translate.Translator(this.uuid);
           this.lang = translator._getLanguage();
//           Main.notifyError(this.lang["key1"]);
	
           //this.configFile = this._pathToComponent("metadata.json", "");
           //global.log("Config file " + this.configFile);
           this.helpFile = this._pathToComponent("README", "");
	
	   this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

	   this._menu.addAction(_("Settings"), Lang.bind(this, function() {
              Util.spawn(['cinnamon-settings', 'desklets', this.uuid]);
	   }));
	
	   this._menu.addAction(_(this.lang["help"]), Lang.bind(this, function() {
	      Util.spawnCommandLine("xdg-open " + this.helpFile);
	   }));

           this.drives = [];
           this.mountsHard = null;
           this.drivesRemovables = [];
           this.namesRemovables = [];
           this.opticalDrives = [];
           this._firstTime = true;
           this._hddTempSoundNotify = false; 
           this._initSettings();		
           this.monitor = Gio.VolumeMonitor.get();
           this.monitor.connect('mount-added', Lang.bind(this, this._onMountAdded));
           this.monitor.connect('mount-removed', Lang.bind(this, this._onMountRemeved));
           this.monitor.connect('volume-added', Lang.bind(this, this._onVolumeAdded));
           this.monitor.connect('volume-removed', Lang.bind(this, this._onVolumeRemoved));
           this.monitor.connect('drive-connected', Lang.bind(this, this._onDriveConnected));
           this.monitor.connect('drive-disconnected', Lang.bind(this, this._onDriveDisconnected));
           //this.monitor.connect('drive-eject-button', Lang.bind(this, this._onDriveEjectButton));
           this._timeout = null;
          // this.print_all_device();
           /*try {
              GLib.spawn_command_line_sync("python '" + this._pathToComponent("kernel.py", "kernel/") + "'");
           }
           catch(e) {
              this._reportFailure(e);
           }*/
           this._optionInstall = -1;
           this._checkUpdate();
	},

	on_desklet_removed: function() {
           if(this._timeout > 0)
	      Mainloop.source_remove(this._timeout);
	},

        _checkPackage: function(packageName) {
           if(!this._isPackageInstall(packageName))
           {
              let _rootContainer = this._createFrame(false);
              let _information = new St.Label();
              let _back = new St.Label();
              _information.style="font-size: " + this._nameSize + "pt";
              _back.style="font-size: " + this._nameSize + "pt";
              if(this._optionInstall == -1) 
              {
                 let _ask = new St.Label();
                 _ask.style="font-size: " + this._nameSize + "pt";
                 _information.set_text(this.lang["installInfo"]);
                 _back.set_text(this.lang["installBack"]);
                 _ask.set_text(this.lang["installAsk"]);
                 let _buttonContainer = new St.BoxLayout({vertical:false});

                 let _yesLabel = new St.Label();
                 _yesLabel.style="font-size: " + this._nameSize + "pt";
                 _yesLabel.set_text("    " + this.lang["yesButton"] + "    ");
                 let _yesButton = new St.Button();
                 _yesButton.connect('notify::hover', Lang.bind(this, this._onHover));
                 _yesButton.set_style('border:1px solid #ffffff; border-radius: 12px;');
                 _yesButton.set_child(_yesLabel);
                 _yesButton.connect('clicked', Lang.bind(this, function() {
                    Util.spawnCommandLine("gksu \"sh -c 'sudo apt-get install -y "+ packageName + "'\"");
                    this._optionInstall = 0;
                 }));

                 _buttonContainer.add(_yesButton, {x_fill: true, x_align: St.Align.END});
                 _rootContainer.add(_information, {x_fill: true, x_align: St.Align.START});
                 _rootContainer.add(_back, {x_fill: true, x_align: St.Align.START});
                 _rootContainer.add(_ask, {x_fill: true, x_align: St.Align.START});
                 _rootContainer.add(_buttonContainer, {x_fill: true, x_align: St.Align.END});
              }
              else if(this._optionInstall == 0)
              {
                 _information.set_text(this.lang["installWait"]);
                 _back.set_text(this.lang["installBack"]);
                 _rootContainer.add(_back, {x_fill: true, expand: true, x_align: St.Align.START});
                 _rootContainer.add(_information, {x_fill: true, expand: true, x_align: St.Align.START});
              }
              return false;
           }
           this._optionInstall = -1;
           return true;
        },

       _checkPermissions: function(folder, permissions, commandLine) {
           let [res, out, err, status] = GLib.spawn_command_line_sync('ls -l ' + folder);
           let out_lines = out.toString().split(" ");
           if(out_lines[0] != permissions)
           {
              let _rootContainer = this._createFrame(false);
              let _information = new St.Label();
              let _back = new St.Label();
              _information.style="font-size: " + this._nameSize + "pt";
              _back.style="font-size: " + this._nameSize + "pt";
              if(this._optionInstall == -1) 
              {
                 let _ask = new St.Label();
                 _ask.style="font-size: " + this._nameSize + "pt";
                 _information.set_text(this.lang["permissionsInfo"]);
                 _back.set_text(this.lang["permissionsBack"]);
                 _ask.set_text(this.lang["permissionsAsk"]);
                 let _buttonContainer = new St.BoxLayout({vertical:false});

                 let _yesLabel = new St.Label();
                 _yesLabel.style="font-size: " + this._nameSize + "pt";
                 _yesLabel.set_text("    " + this.lang["yesButton"] + "    ");
                 let _yesButton = new St.Button();
                 _yesButton.connect('notify::hover', Lang.bind(this, this._onHover));
                 _yesButton.set_style('border:1px solid #ffffff; border-radius: 12px;');
                 _yesButton.set_child(_yesLabel);
                 _yesButton.connect('clicked', Lang.bind(this, function() {
                    Util.spawnCommandLine("gksu \"sh -c 'sudo chown root:root " + folder +" && sudo chmod " + commandLine + " "+ folder+"'\"");
                    this._optionInstall = 0;
                 }));

                 _buttonContainer.add(_yesButton, {x_fill: true, x_align: St.Align.END});
                 _rootContainer.add(_information, {x_fill: true, x_align: St.Align.START});
                 _rootContainer.add(_back, {x_fill: true, x_align: St.Align.START});
                 _rootContainer.add(_ask, {x_fill: true, x_align: St.Align.START});
                 _rootContainer.add(_buttonContainer, {x_fill: true, x_align: St.Align.END});
              }
              else if(this._optionInstall == 0)
              {
                 _information.set_text(this.lang["permissionsWait"]);
                 _back.set_text(this.lang["permissionsBack"]);
                 _rootContainer.add(_back, {x_fill: true, expand: true, x_align: St.Align.START});
                 _rootContainer.add(_information, {x_fill: true, expand: true, x_align: St.Align.START});
              }
              return false;
           }
           this._optionInstall = -1;
           return true;
        },

        _isPackageInstall: function(packageName) {
           let [res, out, err, status] = GLib.spawn_command_line_sync('dpkg -s ' + packageName);
           let out_lines = out.toString().split("\n");
           if(out_lines[0] == "Package: " + packageName)
              return true;
           return false;      
        },

        _reUpdate: function()  {
           this.mountsHard = this._detectMountDevice();
           this._updateDate();
        },

        _checkUpdate: function()  {
           let _checkP = true;
           let _updateNeeded = false;
           if(this._hddTempActive)
              _checkP = (this._checkPackage("hddtemp")) && (this._checkPermissions("/usr/sbin/hddtemp", "-rwsr-xr-x", "u+s"));
           if(this._pMountActive)
              _checkP = this._checkPackage("pmount") && _checkP;

           if(_checkP) {
              if(!this.mountsHard)
              {
                 this.mountsHard = this._detectMountDevice();
                 _updateNeeded = true;
              }
              if((!_updateNeeded)&&((this._capacityDetect)||(this._hddTempActive)))
              {
                 let _currMountsHard = this._detectMountDevice();
                 if(this._hddTempActive) {
                    if(!this.mountsHard[0][6]) {
                       this.mountsHard = _currMountsHard;
                       _updateNeeded = true;
                    }
                    else {
                       for (let _curr in _currMountsHard)
                       {
                          if((this._hddTempActive)&&(_currMountsHard[_curr][6] != this.mountsHard[_curr][6])) {
                             this.mountsHard = _currMountsHard;
                             _updateNeeded = true;
                             break;
                          }
                       }
                    }
                 }
                 if((!_updateNeeded)&&(this._capacityDetect)) {   
                    for (let _curr in _currMountsHard)
                    {
                       if(_currMountsHard[_curr][2] != this.mountsHard[_curr][2]) {
                          this.mountsHard = _currMountsHard;
                          _updateNeeded = true;
                          break;
                       }
                    }
                 }
              }
              if((!_updateNeeded)&&(this._advanceOpticalDetect))
              {
                 for (let _opt in this.opticalDrives)
                 {
                    let _isOptClose = this._isOpticalClosed(this.opticalDrives[_opt][0]);
                    if(this.opticalDrives[_opt][1] != _isOptClose)
                    {
                       this.opticalDrives[_opt][1] = _isOptClose;
                       _updateNeeded = true;
                    }
                 }
              }
              if((_updateNeeded)||(this._firstTime))
              {
                 this._updateDate();
                 this._firstTime = false;
              }
           }

           if((!_checkP)||(this._capacityDetect)||(this._hddTempActive)||(this._advanceOpticalDetect))
           {
              this._firstTime = true;
              this._timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._checkUpdate));
           }
	},

	_updateDate: function() {
           this.opticalDrives = [];
           //this.mountsHard = this._detectMountDevice();
           this._playSoundHddTemp();
           this._addDrives();
          // if((this._advanceOpticalDetect)&&(this._firstTime)) {
             // this._detectOptical();
             // this._upDateOptical();
          //   this._firstTime = false;
          // }
           //this._timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._updateDate));
	},

        _createFrame: function(fixWidth) {
           if(this._deskletFrame)
              this._deskletFrame.destroy();
           this._deskletFrame = new St.Bin({x_align: St.Align.START});
           if(this._showMainBox)
           {
              let _color = (this._boxColor.replace(")",","+this._transparency+")")).replace('rgb','rgba');
              this._deskletFrame.set_style('padding: 4px; border:' + this._borderBoxWidth + 'px solid '+this._borderBoxColor+'; background-color: ' + _color + '; border-radius: 12px;');
           }
           let _rootContainer = new St.BoxLayout({vertical:true});
           _rootContainer.set_style('color:'+ this._fontColor + '; text-shadow: 1px 1px 2px #000;');
           if(fixWidth)
             _rootContainer.set_width(this._width);
           this._deskletFrame.set_child(_rootContainer);
           this.setContent(this._deskletFrame);
           return _rootContainer;
        },
        
        _createDriveContainer: function() {
           let _driveContainer = new St.BoxLayout({vertical:false});
           if(this._showDriveBox)
           {
              let _color = (this._boxColor.replace(")",","+this._transparency+")")).replace('rgb','rgba');
              _driveContainer.set_style('padding: 0px 6px 0px 0px; border:'+ this._borderBoxWidth + 'px solid '+this._borderBoxColor+'; background-color: ' + _color + '; border-radius: 12px;');
           }
           return _driveContainer;
        },

        _addDrives: function() {
           let _rootContainer = this._createFrame(this._fixWidth);
           if(this.drives)
             
           this.drives = [];
           this.listButtonIcon = [];
           this.listButtonEject = [];

           if(this._showHardDrives)
              this._addHardDrives(_rootContainer);
           if(this._showOpticalDrives) {
              this._addMountOpticalDrives(_rootContainer);
              this._addUnmountOpticalDrives(_rootContainer);
           }
           if(this._showRemovableDrives) {
              this._addRemovableMountDrives(_rootContainer);
              if(this._pMountActive)
                this._addRemovableUnmountDrives(_rootContainer);
           }
           if(this._showFixedDrives) {
              this._addMountDrives(_rootContainer);
              this._addUnMountDrives(_rootContainer);
           }
           if(this._showEmptyDrives)
              this._addDrivesEmpty(_rootContainer);
        },

        _addHardDrives: function(_rootContainer) {
           this.listHardIcon = [];

           for (let mount in this.mountsHard) {
              if(this.mountsHard[mount][5].substring(0,6) != "/media") {
                 let _driveIcon = this._getIconImage(this._pathToComponent("disk.png", "theme/" + this._theme + "/"));
                 let _driveButton = new St.Button({ child: _driveIcon });
                 _driveButton.connect('notify::hover', Lang.bind(this, this._onHover));
                 _driveButton.connect('clicked', Lang.bind(this, this._onMountHardClicked));
                 let _iconContainer = new St.BoxLayout({vertical:true});
                 _iconContainer.add(_driveButton, {x_fill: true, x_align: St.Align.START});

                 let _nameContainer = new St.BoxLayout({vertical:false});
                 let _name = new St.Label();
                 let _mountPoint = new St.Label();
                 _name.style="font-size: " + this._nameSize + "pt";
                 _mountPoint.style="font-size: " + this._nameSize + "pt";
                 _name.set_text(this.mountsHard[mount][5]);
                 _mountPoint.set_text("\"" + this.mountsHard[mount][0] + "\"");
                 _nameContainer.add(_name, {x_fill: true, expand: true, x_align: St.Align.START});
                 _nameContainer.add(_mountPoint, {x_fill: true, x_align: St.Align.END});

                 let _capacityContainer = new St.BoxLayout({vertical:false});
                 let _percentContainer = new St.BoxLayout({vertical:true});
                 let _capacity = new St.Label();
                 _capacity.style="font-size: " + this._capacitySize + "pt";
                 let u = this.mountsHard[mount][2];
                 let s = this.mountsHard[mount][1];
                 _capacity.set_text("" + this._convertToString(u) + "/" + this._convertToString(s));
                 
                 _capacityContainer.add(_capacity, {x_fill: true, expand: true, x_align: St.Align.START});
                 if(this._hddTempActive) {
                    let _temp = new St.Label();
                    _temp.style="font-size: " + this._capacitySize + "pt; color:" + this._getHddTempColor(this.mountsHard[mount][6]) + "; text-shadow: 1px 1px 2px #000;";
                    _temp.set_text("" + this.mountsHard[mount][6]);
                    _capacityContainer.add(_temp, {x_fill: true, x_align: St.Align.END});
                 }
                 let _meterIcon = this._getMeterImage(s, u);
                 _percentContainer.add(_meterIcon, {x_fill: true, x_align: St.Align.MIDDLE});

                 let _ejectContainer = new St.BoxLayout({vertical:true, x_align: St.Align.END});
                 _ejectContainer.set_style('padding: 8px 0px 0px 4px;');
                 let _ejectIcon = this._getIconImage(this._pathToComponent("empty.png", "theme/"));
                 _ejectContainer.add(_ejectIcon, {x_fill: true, x_align: St.Align.END});

                 let _infoContainer = new St.BoxLayout({vertical:true});
                 _infoContainer.add(_nameContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                 _infoContainer.add(_percentContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                 _infoContainer.add(_capacityContainer, {x_fill: true, expand: true, x_align: St.Align.START});

                 let _driveContainer = this._createDriveContainer();
                 _driveContainer.add(_iconContainer, {x_fill: true, x_align: St.Align.START});
                 _driveContainer.add(_infoContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                 _driveContainer.add(_ejectContainer, {x_fill: true, x_align: St.Align.END});
                 _rootContainer.add(_driveContainer, {x_fill: true, y_fill: false, expand: true, x_align: St.Align.START});

                 this.listHardIcon.push(_driveButton);
              }
           }
        },

        _addMountOpticalDrives: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if((_listDrives[i])&&(this._isOptical(_listDrives[i]))&&(_listDrives[i].has_volumes()))
              {
                 let _listVols = _listDrives[i].get_volumes();
                 for (let j = 0; j < _listVols.length; j++)
                 {
                    let _mounts = _listVols[j].get_mount();
                    if((_mounts)&&(this._isOptical(_listVols[j])))
                    {
                       let _nameContainer = new St.BoxLayout({vertical:false});
                       let _capacityContainer = new St.BoxLayout({vertical:true});
                       let _percentContainer = new St.BoxLayout({vertical:true});

                       let _name = new St.Label();
                       let _capacity = new St.Label();

                       _name.style="font-size: " + this._nameSize + "pt";
                       _capacity.style="font-size: " + this._capacitySize + "pt";
                       _name.set_text(_mounts.get_name());
                       let s = this._driveSize(_mounts);
                       let u = this._driveUsedSpace(_mounts);
                       let _optData =  this._getOpticalInfo(_listDrives[i]);
                       if(_optData) {
                          s = _optData[1];
                          u = _optData[2];
                       }
		       _capacity.set_text("" + this._convertToString(u) + "/" + this._convertToString(s));
                       _nameContainer.add(_name, {x_fill: true, x_align: St.Align.START});
                       _capacityContainer.add(_capacity);
                       let _driveIcon = this._getIconImage(this._pathToComponent("cdrom.png", "theme/" + this._theme + "/"));
                       let _meterIcon = this._getMeterImage(s, u);
                       _percentContainer.add(_meterIcon, {x_fill: true, x_align: St.Align.START});

                       let _driveButton = new St.Button({ child: _driveIcon });
                       _driveButton.connect('clicked', Lang.bind(this, this._onDriveClicked));
                       _driveButton.connect('notify::hover', Lang.bind(this, this._onHover));
                       let _iconContainer = new St.BoxLayout({vertical:true});
                       _iconContainer.add(_driveButton, {x_fill: true, x_align: St.Align.START});

                       let _ejectContainer = new St.BoxLayout({vertical:true, x_align: St.Align.END});
                       _ejectContainer.set_style('padding: 8px 0px 0px 4px;');
                       let _ejectIcon = this._getIconImage(this._pathToComponent("eject.png", "theme/" + this._theme + "/"));
                       let _ejectButton = new St.Button({ child: _ejectIcon });
                       _ejectButton.connect('clicked', Lang.bind(this, this._onOpticalEject));
                       _ejectButton.connect('notify::hover', Lang.bind(this, this._onHover));
                       _ejectContainer.add(_ejectButton, {x_fill: true, x_align: St.Align.END});

                       let _infoContainer = new St.BoxLayout({vertical:true});
                       _infoContainer.add(_nameContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                       _infoContainer.add(_percentContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                       _infoContainer.add(_capacityContainer, {x_fill: true, expand: true, x_align: St.Align.START});

                       let _driveContainer = this._createDriveContainer();
                       _driveContainer.add(_iconContainer, {x_fill: true, x_align: St.Align.START});
                       _driveContainer.add(_infoContainer,{x_fill: true, expand: true, x_align: St.Align.START});
                       _driveContainer.add(_ejectContainer, {x_fill: true, x_align: St.Align.END});
                       _rootContainer.add(_driveContainer, {x_fill: true, x_align: St.Align.START});

                       if(this._advanceOpticalDetect) { 
                          let _opt = [];
                          _opt.push(_listDrives[i]);
                          _opt.push(true);
                          this.opticalDrives.push(_opt);
                       }

                       this.drives.push(_listDrives[i]);
                       this.listButtonIcon.push(_driveButton);
                       this.listButtonEject.push(_ejectButton);
                    }
                 }
              }
           }
        },

        _addUnmountOpticalDrives: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if((_listDrives[i])&&(this._isOptical(_listDrives[i]))&&(!_listDrives[i].has_volumes()))
              {
                 let _driveIcon = this._getIconImage(this._pathToComponent("cdrom.png", "theme/" + this._theme + "/"));
                 let _iconContainer = new St.BoxLayout({vertical:true});
                 _iconContainer.add(_driveIcon, {x_fill: true, x_align: St.Align.START});

                 let _nameContainer = new St.BoxLayout({vertical:false});
                 let _name = new St.Label();
                 _name.style="font-size: " + this._nameSize + "pt";
                 _name.set_text(_listDrives[i].get_name());
                 _nameContainer.add(_name, {x_fill: true, x_align: St.Align.START});

                 let _infoContainer = new St.BoxLayout({vertical:true});
                 _infoContainer.add(_nameContainer, {x_fill: true, expand: true, x_align: St.Align.MIDDLE});

                 let _ejectContainer = new St.BoxLayout({vertical:true, x_align: St.Align.END});
                 _ejectContainer.set_style('padding: 8px 0px 0px 4px;');
                 let _ejectIcon;
                 let _ejectButton;
                 //if((this._advanceOpticalDetect)&&(!this._firstTime)) {
                 if(this._advanceOpticalDetect) { 
                    let _optCurrent = [];
                    _optCurrent.push(_listDrives[i]);  
                    if(this._isOpticalClosed(_listDrives[i]))
                    {
                       _ejectIcon = this._getIconImage(this._pathToComponent("eject.png", "theme/" + this._theme + "/"));
                       _ejectButton = new St.Button({ child: _ejectIcon });
                       _ejectButton.connect('clicked', Lang.bind(this, this._onOpticalEject));
                       _ejectButton.connect('notify::hover', Lang.bind(this, this._onHover));
                       _optCurrent.push(true);
                    }
                    else
                    {
                       _ejectIcon = this._getIconImage(this._pathToComponent("inject.png", "theme/" + this._theme + "/"));
                       _ejectButton = new St.Button({ child: _ejectIcon });
                       _ejectButton.connect('clicked', Lang.bind(this, this._onOpticalInject));
                       _ejectButton.connect('notify::hover', Lang.bind(this, this._onHover));
                       _optCurrent.push(false);
                    }
                    this.opticalDrives.push(_optCurrent);
                 }
                 else
                 {
                    _ejectIcon = this._getIconImage(this._pathToComponent("empty.png", "theme/"));
                    _ejectButton = new St.Button({ child: _ejectIcon });
                 }
                 _ejectContainer.add(_ejectButton, {x_fill: true, x_align: St.Align.END});

                 let _driveContainer = this._createDriveContainer();
                 _driveContainer.add(_iconContainer, {x_fill: true, x_align: St.Align.START});
                 _driveContainer.add(_infoContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                 _driveContainer.add(_ejectContainer, {x_fill: true, x_align: St.Align.END});
                 _rootContainer.add(_driveContainer, {x_fill: true, x_align: St.Align.START});

                 this.drives.push(_listDrives[i]);
                 this.listButtonIcon.push(null);
                 this.listButtonEject.push(_ejectButton);
              }
           }
        },

        _addRemovableMountDrives: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if((_listDrives[i])&&(_listDrives[i].has_volumes())&&(_listDrives[i].can_eject())&&(!this._isOptical(_listDrives[i])))
              {
                 let _listVols = _listDrives[i].get_volumes();
                 for (let j = 0; j < _listVols.length; j++)
                 {
                    let _mounts = _listVols[j].get_mount();
                    if(_mounts)
                    {
                       let _nameContainer = new St.BoxLayout({vertical:false});
                       let _capacityContainer = new St.BoxLayout({vertical:true});
                       let _percentContainer = new St.BoxLayout({vertical:true});

                       let _name = new St.Label();
                       let _capacity = new St.Label();

                       _name.style="font-size: " + this._nameSize + "pt";
                       _capacity.style="font-size: " + this._capacitySize + "pt";
                       _name.set_text(_mounts.get_name());
                       let s = this._driveSize(_mounts);
                       let u = this._driveUsedSpace(_mounts);
		       _capacity.set_text("" + this._convertToString(u) + "/" + this._convertToString(s));
                       _nameContainer.add(_name, {x_fill: true, x_align: St.Align.START});
                       _capacityContainer.add(_capacity);
                       let _driveIcon = _driveIcon = this._getIconImage(this._pathToComponent("usb.png", "theme/" + this._theme + "/"));
                       let _meterIcon = this._getMeterImage(s, u);
                       _percentContainer.add(_meterIcon, {x_fill: true, x_align: St.Align.START});
                          
                       let _driveButton = new St.Button({ child: _driveIcon });
                       _driveButton.connect('clicked', Lang.bind(this, this._onDriveClicked));
                       _driveButton.connect('notify::hover', Lang.bind(this, this._onHover));
                       let _iconContainer = new St.BoxLayout({vertical:true});
                       _iconContainer.add(_driveButton, {x_fill: true, x_align: St.Align.START});

                       let _ejectContainer = new St.BoxLayout({vertical:true, x_align: St.Align.END});
                       _ejectContainer.set_style('padding: 8px 0px 0px 4px;');
                       let _ejectIcon = this._getIconImage(this._pathToComponent("eject.png", "theme/" + this._theme + "/"));
                       let _ejectButton = new St.Button({ child: _ejectIcon });
                       _ejectButton.connect('clicked', Lang.bind(this, this._onDriveEject));
                       _ejectButton.connect('notify::hover', Lang.bind(this, this._onHover));
                       _ejectContainer.add(_ejectButton, {x_fill: true, x_align: St.Align.END});

                       let _infoContainer = new St.BoxLayout({vertical:true});
                       _infoContainer.add(_nameContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                       _infoContainer.add(_percentContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                       _infoContainer.add(_capacityContainer, {x_fill: true, expand: true, x_align: St.Align.START});

                       let _driveContainer = this._createDriveContainer();
                       _driveContainer.add(_iconContainer, {x_fill: true, x_align: St.Align.START});
                       _driveContainer.add(_infoContainer,{x_fill: true, expand: true, x_align: St.Align.START});
                       _driveContainer.add(_ejectContainer, {x_fill: true, x_align: St.Align.END});
                       _rootContainer.add(_driveContainer, {x_fill: true, x_align: St.Align.START});

                       this.drives.push(_listVols[j]);
                       this.listButtonIcon.push(_driveButton);
                       this.listButtonEject.push(_ejectButton);
                    }
                 }
              }
           }
        },

        _addRemovableUnmountDrives: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if((_listDrives[i])&&(_listDrives[i].has_volumes())&&(_listDrives[i].can_eject())&&(!this._isOptical(_listDrives[i])))
              {
                 let _listVols = _listDrives[i].get_volumes();
                 for (let j = 0; j < _listVols.length; j++)
                 {
                    if(!this._isRemovableMount(_listVols[j]))
                    {
                       let _driveIcon = this._getIconImage(this._pathToComponent("usb.png", "theme/" + this._theme + "/"));
                       let _iconContainer = new St.BoxLayout({vertical:true});
                       _iconContainer.add(_driveIcon, {x_fill: true, x_align: St.Align.START});

                       let _nameContainer = new St.BoxLayout({vertical:false});
                       let _name = new St.Label();
                       _name.style="font-size: " + this._nameSize + "pt";
                       _name.set_text(_listVols[j].get_name());
                       _nameContainer.add(_name, {x_fill: true, x_align: St.Align.START});

                       let _ejectContainer = new St.BoxLayout({vertical:true, x_align: St.Align.END});
                       _ejectContainer.set_style('padding: 8px 0px 0px 4px;');
                       let _ejectIcon = this._getIconImage(this._pathToComponent("inject.png", "theme/" + this._theme + "/"));
                       let _ejectButton = new St.Button({ child: _ejectIcon });
                       _ejectButton.connect('clicked', Lang.bind(this, this._onDriveInject));
                       _ejectButton.connect('notify::hover', Lang.bind(this, this._onHover));
                       _ejectContainer.add(_ejectButton, {x_fill: true, x_align: St.Align.START});

                       let _infoContainer = new St.BoxLayout({vertical:true});
                       _infoContainer.add(_nameContainer, {x_fill: true, expand: true, x_align: St.Align.MIDDLE});

                       let _driveContainer = this._createDriveContainer();
                       _driveContainer.add(_iconContainer, {x_fill: true, x_align: St.Align.START});
                       _driveContainer.add(_infoContainer, {x_fill: true, expand: true, expand: true, x_align: St.Align.START});
                       _driveContainer.add(_ejectContainer, {x_fill: true, x_align: St.Align.END});
                       _rootContainer.add(_driveContainer, {x_fill: true, x_align: St.Align.START});

                       this.drives.push(_listVols[j]);
                       this.listButtonIcon.push(null);
                       this.listButtonEject.push(_ejectButton);
                    }
                 }
              }
           }
        },

        _addMountDrives: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if((_listDrives[i])&&(_listDrives[i].has_volumes())&&(!_listDrives[i].can_eject()))
              {
                 let _listVols = _listDrives[i].get_volumes();
                 for (let j = 0; j < _listVols.length; j++)
                 {
                    let _mounts = _listVols[j].get_mount();
                    if(_mounts)
                    {
                       let _nameContainer = new St.BoxLayout({vertical:false});
                       let _capacityContainer = new St.BoxLayout({vertical:true});
                       let _percentContainer = new St.BoxLayout({vertical:true});

                       let _name = new St.Label();
                       let _capacity = new St.Label();

                       _name.style="font-size: " + this._nameSize + "pt";
                       _capacity.style="font-size: " + this._capacitySize + "pt";
                       _name.set_text(_mounts.get_name());
                       let s = this._driveSize(_mounts);
                       let u = this._driveUsedSpace(_mounts);
		       _capacity.set_text("" + this._convertToString(u) + "/" + this._convertToString(s));
                       _nameContainer.add(_name, {x_fill: true, x_align: St.Align.START});
                       _capacityContainer.add(_capacity);
                       let _meterIcon = this._getMeterImage(s, u);
                       _percentContainer.add(_meterIcon, {x_fill: true, x_align: St.Align.START});

                       let _driveIcon = this._getIconImage(this._pathToComponent("drive.png", "theme/" + this._theme + "/"));
                       let _driveButton = new St.Button({ child: _driveIcon });
                       _driveButton.connect('clicked', Lang.bind(this, this._onDriveClicked));
                       _driveButton.connect('notify::hover', Lang.bind(this, this._onHover));
                       let _iconContainer = new St.BoxLayout({vertical:true});
                       _iconContainer.add(_driveButton, {x_fill: true, x_align: St.Align.START});

                       let _ejectContainer = new St.BoxLayout({vertical:true, x_align: St.Align.END});
                       _ejectContainer.set_style('padding: 8px 0px 0px 4px;');
                       let _ejectIcon = this._getIconImage(this._pathToComponent("eject.png", "theme/" + this._theme + "/"));
                       let _ejectButton = new St.Button({ child: _ejectIcon });
                       _ejectButton.connect('clicked', Lang.bind(this, this._onDriveEject));
                       _ejectButton.connect('notify::hover', Lang.bind(this, this._onHover));
                       _ejectContainer.add(_ejectButton, {x_fill: true, x_align: St.Align.END});

                       let _infoContainer = new St.BoxLayout({vertical:true});
                       _infoContainer.add(_nameContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                       _infoContainer.add(_percentContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                       _infoContainer.add(_capacityContainer, {x_fill: true, expand: true, x_align: St.Align.START});

                       let _driveContainer = this._createDriveContainer();
                       _driveContainer.add(_iconContainer, {x_fill: true, x_align: St.Align.START});
                       _driveContainer.add(_infoContainer,{x_fill: true, expand: true, x_align: St.Align.START});
                       _driveContainer.add(_ejectContainer, {x_fill: true, x_align: St.Align.END});
                       _rootContainer.add(_driveContainer, {x_fill: true, x_align: St.Align.START});

                       this.drives.push(_listVols[j]);
                       this.listButtonIcon.push(_driveButton);
                       this.listButtonEject.push(_ejectButton);
                    }
                 }
              }
           }
        },

        _addUnMountDrives: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if((_listDrives[i])&&(_listDrives[i].has_volumes())&&(!_listDrives[i].can_eject()))
              {
                 let _listVols = _listDrives[i].get_volumes();
                 for (let j = 0; j < _listVols.length; j++)
                 {
                    let _mounts = _listVols[j].get_mount();
                    if(!_mounts)
                    {
                       let _driveIcon = this._getIconImage(this._pathToComponent("drive.png", "theme/" + this._theme + "/"));
                       let _iconContainer = new St.BoxLayout({vertical:true});
                       _iconContainer.add(_driveIcon, {x_fill: true, x_align: St.Align.START});

                       let _nameContainer = new St.BoxLayout({vertical:false});
                       let _name = new St.Label();
                       _name.style="font-size: " + this._nameSize + "pt";
                       _name.set_text(_listVols[j].get_name());
                       _nameContainer.add(_name, {x_fill: true, x_align: St.Align.START});

                       let _ejectContainer = new St.BoxLayout({vertical:true, x_align: St.Align.END});
                       _ejectContainer.set_style('padding: 8px 0px 0px 4px;');
                       let _ejectIcon = this._getIconImage(this._pathToComponent("inject.png", "theme/" + this._theme + "/"));
                       let _ejectButton = new St.Button({ child: _ejectIcon });
                       _ejectButton.connect('clicked', Lang.bind(this, this._onDriveInject));
                       _ejectButton.connect('notify::hover', Lang.bind(this, this._onHover));
                       _ejectContainer.add(_ejectButton, {x_fill: true, x_align: St.Align.START});

                       let _infoContainer = new St.BoxLayout({vertical:true});
                       _infoContainer.add(_nameContainer, {x_fill: true, expand: true, x_align: St.Align.MIDDLE});

                       let _driveContainer = this._createDriveContainer();
                       _driveContainer.add(_iconContainer, {x_fill: true, x_align: St.Align.START});
                       _driveContainer.add(_infoContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                       _driveContainer.add(_ejectContainer, {x_fill: true, x_align: St.Align.END});
                       _rootContainer.add(_driveContainer, {x_fill: true, x_align: St.Align.START});

                       this.drives.push(_listVols[j]);
                       this.listButtonIcon.push(null);
                       this.listButtonEject.push(_ejectButton);
                    }  
                 }
              }
           }
        },

        _addDrivesEmpty: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if((_listDrives[i])&&(!_listDrives[i].has_volumes())&&(_listDrives[i].can_poll_for_media())&&(!this._isOptical(_listDrives[i])))
              {
                 let _driveIcon = this._getIconImage(this._pathToComponent("empty.png", "theme/" + this._theme + "/"));
                 let _iconContainer = new St.BoxLayout({vertical:true});
                 _iconContainer.add(_driveIcon, {x_fill: true, x_align: St.Align.START});

                 let _nameContainer = new St.BoxLayout({vertical:false});
                 let _name = new St.Label();
                 _name.style="font-size: " + this._nameSize + "pt";
                 _name.set_text(_listDrives[i].get_name());
                 _nameContainer.add(_name, {x_fill: true, x_align: St.Align.START});

                 let _infoContainer = new St.BoxLayout({vertical:true});
                 _infoContainer.add(_nameContainer, {x_fill: true, expand: true, x_align: St.Align.MIDDLE});

                 let _ejectContainer = new St.BoxLayout({vertical:true, x_align: St.Align.END});
                 _ejectContainer.set_style('padding: 8px 0px 0px 4px;');
                 let _ejectIcon = this._getIconImage(this._pathToComponent("empty.png", "theme/"));
                 _ejectContainer.add(_ejectIcon, {x_fill: true, x_align: St.Align.END});

                 let _driveContainer = this._createDriveContainer();
                 _driveContainer.add(_iconContainer, {x_fill: true, x_align: St.Align.START});
                 _driveContainer.add(_infoContainer, {x_fill: true, expand: true, x_align: St.Align.START});
                 _driveContainer.add(_ejectContainer, {x_fill: true, x_align: St.Align.END});
                 _rootContainer.add(_driveContainer, {x_fill: true, x_align: St.Align.START});

                 this.drives.push(_listDrives[i]);
                 this.listButtonIcon.push(null);
                 this.listButtonEject.push(null);
              }
           }
        },

        _getIconImage: function(pathC) {
           try {
             let file = Gio.file_new_for_path(pathC);
             let icon_uri = file.get_uri();
             //return St.TextureCache.get_default().load_uri_sync(1, icon_uri, 1064, 1064);
              return St.TextureCache.get_default().load_uri_async(icon_uri, 1064, 1064);
           }catch(e) {
	     //this._reportFailure(e);
	   }        
        },

        _getMeterImage: function(size, used) {
           let _imageNumber = 1;
           if(size > 0)
              _imageNumber = (used/size)*10 + 1;
           _imageNumber = Math.floor(Math.round(_imageNumber));
           return this._getIconImage(this._pathToComponent("meter" + _imageNumber + ".png", "meter/"));
        },

        _isRemovableMount: function(removableVol) {
           for (let i = 0; i < this.mountsHard.length; i++)
           {
              if(this._getIdentifier(removableVol) == this.mountsHard[i][0])
                  return true;
           }
           return false;
        },       

        _findMountHardOfIcon: function(bt) {
           for (let i = 0; i < this.mountsHard.length; i++)
           {
              if(this.listHardIcon[i] == bt)
                 return this.mountsHard[i];
           }
           return null;
        },

        _findDriveOfIcon: function(bt) {
           for (let i = 0; i < this.drives.length; i++)
           {
              if(this.listButtonIcon[i] == bt)
                 return this.drives[i];
           }
           return null;
        },

        _findDriveOfEject: function(bt) {
           for (let i = 0; i < this.drives.length; i++)
           {
              if(this.listButtonEject[i] == bt)
                 return this.drives[i];
           }
           return null;
        },
  
        _driveSize: function(deviceMount) {
           let _size = 0;
           try {
             let _attribute = "filesystem::size";
             let _file_info = deviceMount.get_root().query_filesystem_info(_attribute, null);
             _size = _file_info.get_attribute_uint64(_attribute);
           }catch(e) {
             _size = 0;
           }
           return _size;
        },

        _driveUsedSpace: function(deviceMount) {
           let _size = 0;
           try {
             let _attribute = "filesystem::used";
             let _file_info = deviceMount.get_root().query_filesystem_info(_attribute, null);
             _size = _file_info.get_attribute_uint64(_attribute);
           }catch(e) {
             _size = 0;
           }
           return _size;
        },

        _drivePath: function(deviceMount) {
           let _result = deviceMount.get_root().get_path();
           return _result;
	},

        _getIdentifier: function(deviceVolumen) {
            return deviceVolumen.get_identifier(Gio.VOLUME_IDENTIFIER_KIND_UNIX_DEVICE);	
        },

        _get_icon: function(deviceMount) {
           return deviceMount.get_icon();
	},

        _convertToString: function(size) {
           let converted_string;
           let suffix = "Bt";
           let index = 0;
           let prefixNumber = size;
           while (prefixNumber > 999)
	   {
              prefixNumber /= 1000;
              index++;
           }
           switch(index) {
             case 1: suffix = "KB" ;break;
             case 2: suffix = "MB" ;break;
             case 3: suffix = "GB" ;break;
             case 4: suffix = "TB" ;break;
             default:suffix = "Bt" ;break;
           }
           return "" + prefixNumber.toFixed(2) + "" + suffix;
        },

        _onOpticalInject: function(bt) {
           let _drive = this._findDriveOfEject(bt);
           if(_drive)
           {
              this._injectByCommand(_drive);
              Main.notifyError(this.lang["injectDevice"]);
           }
        },

        _onOpticalEject: function(bt) {
           let _drive = this._findDriveOfEject(bt);
           if(_drive)
           {
              this._ejectByCommand(_drive);
              Main.notifyError(this.lang["ejectDevice"]);
           }
        },

        _onDriveEject: function(bt) {
           let _volumen = this._findDriveOfEject(bt); //In this case Volumen...
           if(_volumen)
           {
              if((this._pMountActive)&&(_volumen.can_eject()))
              {
                 let _idVol = this._getIdentifier(_volumen);
                 Util.spawnCommandLine("pumount " + _idVol);
                 this.drivesRemovables.push(_volumen.get_mount());
               /*  Main.notifyError("Device Eject");
                 global.play_theme_sound(0, 'device-removed-media'); */
              }
              else
              {
                 let _mount = _volumen.get_mount();
                 let _mountOp = new CinnamonMountOperation.CinnamonMountOperation(_volumen.get_mount());
                 if (_mount.can_eject())
                    _mount.eject_with_operation(Gio.MountUnmountFlags.NONE, _mountOp.mountOp, null, Lang.bind(this, this._onEjectFinish));   
                 else
                    _mount.unmount_with_operation(Gio.MountUnmountFlags.NONE, _mountOp.mountOp, null, Lang.bind(this, this._onUnmountFinish));
              }
           }
        },

        _onDriveInject: function(bt) {
           let _volumen = this._findDriveOfEject(bt); //In this case Volumen...
             
           if(_volumen)
           {//Test Gio.MountUnmountFlags.FORCE
              try { 
                    if((this._pMountActive)&&(_volumen.can_eject()))
                    {
                       let _idVol = this._getIdentifier(_volumen);
                       Util.spawnCommandLine("pmount " + _idVol);
                       this.drivesRemovables.push(_idVol);
                    }
                    else
                    {
                       let _mountOp = new CinnamonMountOperation.CinnamonMountOperation(_volumen);
                       if(_volumen.can_eject())
                          _volumen.eject_with_operation(Gio.MountUnmountFlags.NONE, _mountOp.mountOp, null, Lang.bind(this, this._remountFinish));  
                       else
                          _volumen.mount(Gio.MountUnmountFlags.NONE, _mountOp.mountOp, null, Lang.bind(this, this._onVolumeMountedFinish));
                    }
              }
              catch(e) {
                 Main.notifyError(this.lang["fail"], e.message);
              }
           }
        },

        _onUnmountFinish: function(mount, result) {
           try {
              mount.unmount_with_operation_finish(result);
              Main.notifyError(this.lang["ejectDevice"]);
           } catch(e) {
              this._reportFailure(e);
           }
        },

        _onEjectFinish: function(mount, result) {
           try {
             mount.eject_with_operation_finish(result);
             Main.notifyError(this.lang["ejectDevice"]);
           } catch(e) {
             this._reportFailure(e);
           }
        },

        _onVolumeMountedFinish: function(volumen, result) {
           try {
              volumen.mount_finish(result);
              this._openVolumen(volumen);
              Main.notifyError(this.lang["injectDevice"]);
    	   } catch (e) {
              this._reportFailure(e);
           }
        },

        _openVolumen: function(volumenDevice) {
           if(this._openConnect)
           {
              let urlPath = this._drivePath(volumenDevice.get_mount());
              Util.spawnCommandLine(this._browser + " '" + urlPath + "'");
           }
        },

        _onMountAdded: function(monit, mount) {
           try {
              let _findVol = false;
              for (let i = 0; i < this.drivesRemovables.length; i++)
              {
                 if(this.drivesRemovables[i] == this._getIdentifier(mount.get_volume()))
                 {
                    Main.notifyError(this.lang["injectDevice"]);
                    global.play_theme_sound(0, 'device-added-media');
                    this._openVolumen(mount.get_volume());
                    /*Remove Volumen on this.drivesRemovables */
                    this.drivesRemovables.splice(i, 1);
                    break;
                 }
              }
              
           } catch(e) {
              this._reportFailure(e);
           }
           Mainloop.timeout_add_seconds(0.1, Lang.bind(this, this._reUpdate));
        },

        _onMountRemeved: function(monit, mount) {
           try {
              let _findVol = false;
              for (let i = 0; i < this.drivesRemovables.length; i++)
              {
                 if(this.drivesRemovables[i] == mount)
                 {
                    Main.notifyError(this.lang["ejectDevice"]);
                    global.play_theme_sound(0, 'device-removed-media');
                    /*Remove Volumen on this.drivesRemovables */
                    this.drivesRemovables.splice(i, 1);
                    break;
                 }
              }
              
           } catch(e) {
              this._reportFailure(e);
           }
           Mainloop.timeout_add_seconds(0.1, Lang.bind(this, this._reUpdate));
        },

        _onVolumeAdded: function(monit, volumen) {
           Mainloop.timeout_add_seconds(0.1, Lang.bind(this, this._reUpdate));
        },

        _onVolumeRemoved: function(monit, volumen) {
           Mainloop.timeout_add_seconds(0.1, Lang.bind(this, this._reUpdate));
        },

        _onDriveConnected: function(monit, drive) {
           Mainloop.timeout_add_seconds(0.1, Lang.bind(this, this._reUpdate));
        },

        _onDriveDisconnected: function(monit, drive) {
           Mainloop.timeout_add_seconds(0.1, Lang.bind(this, this._reUpdate));
        },
/*
        _onDriveEjectButton: function(monit, drive) {
           Main.notifyError("Entro");
           //this._reUpdate();
        },
*/
        _onDriveClicked: function(bt) {
           let _volumen = this._findDriveOfIcon(bt); //Posible Drive, not a Volumen...
           try {
              let _listVols = _volumen.get_volumes();//Test for a Drive?
              _volumen = _listVols[0];//Yes it's correct, them changed.
           } catch(e) {
             //Drive it's a Volumen, do nothing...
           }
           
           let urlPath = this._drivePath(_volumen.get_mount()); //A volumen need to be mount, or don't have mount point to open.
           this._animateIcon(bt, 0);
           Util.spawnCommandLine(this._browser + " '" + urlPath + "'");
        },

        _onMountHardClicked: function(bt) {
           let _hardDrive = this._findMountHardOfIcon(bt);
           let urlPath = _hardDrive[5];
           this._animateIcon(bt);
           Util.spawnCommandLine(this._browser + " '" + urlPath + "'");
        },

        _onHover: function (actor) {
           if (actor.get_hover())
               global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
           else
              global.unset_cursor();
           //global.set_cursor(Cinnamon.Cursor.DND_IN_DRAG);
        },

        _path: function() {
           return GLib.get_home_dir()+ "/.local/share/cinnamon/desklets/" + this.uuid + "/";
        },

        _pathToComponent: function(name, location) {
           return this._path() + location + name;
        },
/*****Optical Device*******/
        _ejectByCommand: function(opticalDrive) {
           let _deviceName = this._getIdentifier(opticalDrive);
           GLib.spawn_command_line_async('eject ' + _deviceName);
        },

        _injectByCommand: function(opticalDrive) {
           let _deviceName = this._getIdentifier(opticalDrive);
           GLib.spawn_command_line_async('eject -t ' + _deviceName);
        },
/*
        _findOpticalByDeviceName: function(devName) {
           for (let i = 0; i < this.opticalDrives.length; i++)
           {
              if(this.opticalDrives[i][0] == devName)
              {
                 return this.opticalDrives[i];
              }
           }
           return null;
        },
*/
        _isOptical: function(opticalDrive) {
           let _deviceName = this._getIdentifier(opticalDrive);
           let _matchSR = _deviceName.match(new RegExp('/dev/sr[0-9]+', 'g'));
           let _matchCDRomN = _deviceName.match(new RegExp('/dev/cdrom[0-9]+', 'g'));
           let _matchCDRom = _deviceName.match(new RegExp('/dev/cdrom', 'g'));
           let _matchSCD = _deviceName.match(new RegExp('/dev/scd[0-9]+', 'g'));
           let _matchHDC = _deviceName.match(new RegExp('/dev/hdc', 'g'));
           if((_deviceName != null)&&((_matchSR != null)||(_matchCDRomN != null)||(_matchCDRom != null)||(_matchSCD != null)||(_matchHDC != null)))
           {
             /* if((this._advanceOpticalDetect)&&(!this._firstTime))
                 return (this._findOpticalByDeviceName(_deviceName) != null);*/
             return true;
           }	
	   return false;
	},

        _getOpticalInfo: function(opticalDrive) {
           let _deviceName = this._getIdentifier(opticalDrive);
           if(_deviceName) {
              for(let _posHard in this.mountsHard) {
                 if(_deviceName == this.mountsHard[_posHard][0])
                    return this.mountsHard[_posHard];
              }
           }
           return null;
        },

        _isOpticalClosed: function(opticalDrive) {
           if(!opticalDrive.has_volumes())
           {
              let _deviceName = this._getIdentifier(opticalDrive);
              if(_deviceName) {
                 let [res, out, err, status] = GLib.spawn_command_line_sync('cdrecord -V --inq dev=' + _deviceName);
                 let _closeErr = err.toString().indexOf("tray closed");
                 let _closeOut = out.toString().indexOf("tray closed");
                 return ((_closeErr != -1)||(_closeErr != -1));
              }
           }
           
           return true;
        },
/*
        _detectOptical: function() {
          this.opticalDrives = [];
          try {
             let client = new GUdev.Client({subsystems: []});
             let enumerator = new GUdev.Enumerator({client: client});
             enumerator.add_match_subsystem('b*');

             let devices = enumerator.execute();

             for (let n=0; n < devices.length; n++) {
                let device = devices[n];
                if(device.get_property("ID_CDROM") != null)
                {
                   let _opticalDrive = [];
                   _opticalDrive.push(device.get_device_file().toString());
                   _opticalDrive.push("");
                   _opticalDrive.push(0);
                   _opticalDrive.push(0);
                   this.opticalDrives.push(_opticalDrive);
                }
             }
          }
          catch(e) {
             this._reportFailure(e);
          }
        },

        _upDateOptical: function() {
           for(let _posOpt in this.opticalDrives) {
              for(let _posHard in this.mountsHard) {
                 if(this.opticalDrives[_posOpt][0] == this.mountsHard[_posHard][0])
                 {
                    let _optCurrent = this.opticalDrives[_posOpt];
                    this.opticalDrives[_posOpt][1] = this.mountsHard[_posHard][5];
                    this.opticalDrives[_posOpt][2] = this.mountsHard[_posHard][1];
                    this.opticalDrives[_posOpt][3] = this.mountsHard[_posHard][2];
                 }
              }
           }
        },
*/
/*****Optical Device*******/
        //Find speed read and write
        _updateDisk: function() {
           let _fileDiskstats = GLib.file_get_contents("/proc/diskstats");
           let _linesDiskstats = ("" + _fileDiskstats[1]).split("\n");

           let _diskReadTotal = 0;
           let _diskWriteTotal = 0;
           let _diskIdle = new Date().getTime()/1000;

           for (let i = 0; i < _linesDiskstats.length; i++)
           {
              let _values;

              if (_linesDiskstats[i].match(/^\s*\d+\s*\d+\s[a-z]+\s/))
              {
                 let _values = _linesDiskstats[i].match(/^\s*\d+\s*\d+\s[a-z]+\s(.*)$/)[1].split(" ");

                 _diskReadTotal += parseInt(_values[2]);
                 _diskWriteTotal += parseInt(_values[6]);
              }
           }
         
           if ((this.diskReadTotalOld == null && this.diskWriteTotalOld == null && this.diskIdleOld == null) || (this.diskIdleOld == _diskIdle))
           {
              this.diskReadTotalOld = _diskReadTotal;
              this.diskWriteTotalOld = _diskWriteTotal;
              this.diskIdleOld = _diskIdle - 1;
           }

           let _diskRead = Math.round((this.diskReadTotalOld - _diskReadTotal)/(this.diskIdleOld - _diskIdle)/2/1024);
           let _diskWrite = Math.round((this.diskWriteTotalOld - _diskWriteTotal)/(this.diskIdleOld - _diskIdle)/2/1024);

           this.diskReadTotalOld = _diskReadTotal;
           this.diskWriteTotalOld = _diskWriteTotal;
           this.diskIdleOld = _diskIdle;

           //Main.notifyError(_diskRead.toString() + " / " + _diskWrite.toString());
        },

        _writeMountDevice: function() {
           try {
              this.fileDataDevice = this._path() + "datadevice";
              GLib.spawn_command_line_async("sh -c 'df > " + this.fileDataDevice + "'");
           } catch(e) {
              this._reportFailure(e);
           }
        },

        _writeHDDTemp: function() {
           try {
             // GLib.spawn_command_line_async("sh -c 'export varLester=Lester'");
              this.fileDataHDDTemp = this._path() + "datahddtemp";
              if((this._hddTempActive)&&(this.mountsHard)) {
                 let deviceList = "";
                 for(let currDevice in this.mountsHard) {
                    if((this.mountsHard[currDevice])&&(this.mountsHard[currDevice][0].indexOf("/dev/") != -1))
                       deviceList = deviceList + " " + this.mountsHard[currDevice][0];
                 }
                 GLib.spawn_command_line_async("sh -c 'hddtemp " + deviceList + " > " + this.fileDataHDDTemp + "'");
              }
           } catch(e) {
              this._reportFailure(e);
           }
        },

        _detectMountDevice: function() {
           try {
              if(!this.mountsHard)
              {
                 //this._writeMountDevice();
                 this._writeHDDTemp();
                 return this._intHDDTemp(this._intMountDevice());
              }
              //let _currMountsHard = this._readHDDTemp(this._readMountDevice());
              let _currMountsHard = this._readHDDTemp(this._intMountDevice());
              //Main.notifyError(_currMountsHard[0][0]);
              this._writeHDDTemp();
              if(_currMountsHard[0])
                 return _currMountsHard;
           } catch (e) {
              Main.notifyError("Error:", e.message);
           }
           return this.mountsHard;
        },

        _readMountDevice: function() {
           try {
              if(!this.mountsHard)
                 return this._intMountDevice();
              let mount_lines = this._readFile(this.fileDataDevice).split("\n");
              let _currMountsHard = [];
              let lineMount;
              let mount;
              let pos;
              for(let mount_line in mount_lines) {
                 lineMount = mount_lines[mount_line].toString();
                 mount = lineMount.split(/\s+/);
                 if(mount[0].indexOf("/dev/") == 0) {
                    if(mount[0].indexOf(":") != -1)
                        break;
                    let _mount = [];
                    _mount.push(mount[0]);
                    _mount.push(1024*mount[1]);
                    _mount.push(1024*mount[2]);
                    _mount.push(1024*mount[3]);
                    _mount.push(mount[4]);
                    pos = lineMount.indexOf(mount[5]);
                    _mount.push(lineMount.substring(pos, lineMount.length));
                    _mount.push("");
                    _currMountsHard.push(_mount);
                 }
              }
              if(_currMountsHard[0])
                 return _currMountsHard;
           } catch (e) {
              Main.notifyError("Error:", e.message);
           }
           return this.mountsHard;
        },

        _readHDDTemp: function(currMountsHard) {
           try {
              //let [res, out, err, status] = GLib.spawn_command_line_sync("sh -c 'echo $varLester'");
              ///Main.notifyError("Es: " + out.toString());
              if(currMountsHard[0]) {
                 if(this._hddTempActive) {
                    mount_lines = this._readFile(this.fileDataHDDTemp).split("\n");
                    // Main.notifyError(currMountsHard[0][0]);
                    for(let mount_line in mount_lines) {
                       lineMount = mount_lines[mount_line].toString();
                       mount = lineMount.split(": ");
                       if((mount[2])&&(currMountsHard[mount_line])) {
                          //Main.notifyError(mount[0]);
                          currMountsHard[mount_line][6] = mount[2];
                       }
                    }
                 }
              }
              return currMountsHard;
           } catch (e) {
              Main.notifyError("Error:", e.message);
           }
           return this.mountsHard;
        },

        _intMountDevice: function() {
           let [res, out, err, status] = GLib.spawn_command_line_sync('df');
           let mount_lines = out.toString().split("\n");
           let _currMountsHard = [];
           let lineMount;
           let mount;
           let pos;
           for(let mount_line in mount_lines) {
              lineMount = mount_lines[mount_line].toString();
              mount = lineMount.split(/\s+/);
              if(mount[0].indexOf("/dev/") == 0) {
                 let _mount = [];
                 _mount.push(mount[0]);
                 _mount.push(1024*mount[1]);
                 _mount.push(1024*mount[2]);
                 _mount.push(1024*mount[3]);
                 _mount.push(mount[4]);
                 pos = lineMount.indexOf(mount[5]);
                 _mount.push(lineMount.substring(pos, lineMount.length));
                 _mount.push("");
                 _currMountsHard.push(_mount);
              }
           }
           return _currMountsHard;
        },

        _intHDDTemp: function(currMountsHard) {
           if((this._hddTempActive)&&(currMountsHard)) {
              for(let _currMount in currMountsHard) {
                 if(currMountsHard[_currMount]) {
                    let [res, out, err, status] = GLib.spawn_command_line_sync('hddtemp ' + currMountsHard[_currMount][0]);
                    let mount_lines = out.toString().split("\n");
                    if(mount_lines[0]) {
                       let _lines = mount_lines[0].split(": ");
                       if(_lines[2])
                          currMountsHard[_currMount][6] = _lines[2];
                    }
                 }
              }
           }
           return currMountsHard;
        },

        _reportFailure: function(exception) {
	   Main.notifyError(this.lang["fail"], exception.message);
        },

        _playSoundHddTemp: function() {
           if((this._hddTempActive)&&(this._hddTempSound)) {
              try {
                 let _tempValue;
                 let _playSound = false; 
                 let regE = new RegExp('[0-9]+', 'g');
                 for(let _currMount in this.mountsHard) {
                    if((this.mountsHard[_currMount])&&(this.mountsHard[_currMount][6]))
                    {
                       _tempValue = this.mountsHard[_currMount][6].match(regE);
                       if((_tempValue)&&(_tempValue[0])&&(_tempValue[0] >= this._criticalHddTemp))
                       {
                          _playSound = true;
                          break;
                       }
                    }
                 }
                 if(_playSound)
                 {
                    if(!this._hddTempSoundNotify)
                    {
                       this._hddTempSoundNotify = true;
                       global.play_theme_sound(0, 'suspend-error');
                    }
                 }
                 else
                    this._hddTempSoundNotify = false;
              } catch(e) {
                  Main.notifyError("Error:", e.message);
              }
           }
        },

        _getHddTempColor: function(tempString) {
           let _tempValue = tempString.match(new RegExp('[0-9]+', 'g'));
           if((_tempValue)&&(_tempValue[0])) {
              if(_tempValue[0] >= this._criticalHddTemp)
                 return this._critialHddColor;
              if(_tempValue[0] >= this._warningHddTemp)
                 return this._warningHddColor; 
           }
           return this._normalHddColor;
        },

        _readFile: function(path) {
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
             return "";
          }
          catch(e) {
             Main.notifyError("Error:", e.message);
          }
       },

        _animateIcon: function(animeIcon, step) {
           if (step>=3) return;
           Tweener.addTween(animeIcon,
           {   width: 40,
               height: 40,
               time: 0.1,
               transition: 'easeOutQuad',
               onComplete: function(){
                  Tweener.addTween(animeIcon,
                  {   width: 48,
                      height: 48,
                      time: 0.2,
                      transition: 'easeOutQuad',
                      onComplete: function(){
                         this._animateIcon(animeIcon, step+1);
                      },
                      onCompleteScope: this
                  });
               },
               onCompleteScope: this
           });
        },

        _on_setting_changed: function() {
           if(this._timeout > 0)
              Mainloop.source_remove(this._timeout);
           this._timeout = null;
           this._deskletFrame.destroy();
           this._optionInstall = -1;
           this._firstTime = true;
           this._checkUpdate();
           //  this._addDrives();
           //this._updateDate();   
        },

        _onTypeOpenChanged: function() {
           GLib.spawn_command_line_async('gsettings set org.gnome.desktop.media-handling automount-open ' + this._openSystem);
        },
        
        _initSettings: function(){
          try {
            this.settings = new Settings.DeskletSettings(this, this.metadata["uuid"], this.instance_id);
            this.settings.bindProperty(Settings.BindingDirection.IN, "mainBox", "_showMainBox", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "driveBox", "_showDriveBox", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "theme", "_theme", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "hardDrives", "_showHardDrives", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "opticalDrives", "_showOpticalDrives", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "removableDrives", "_showRemovableDrives", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "fixedDrives",  "_showFixedDrives", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "emptyDrives", "_showEmptyDrives", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "openWith", "_browser", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "openConnect", "_openConnect", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "fixWidth", "_fixWidth", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "width", "_width", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "borderBoxWidth", "_borderBoxWidth", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "borderBoxColor", "_borderBoxColor", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "boxColor", "_boxColor", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "fontColor", "_fontColor", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "fontNameSize", "_nameSize", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "fontCapacitySize", "_capacitySize", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "transparency", "_transparency", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "capacityDetect", "_capacityDetect", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "advanceOpticalDetect", "_advanceOpticalDetect", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "hddTempSound", "_hddTempSound", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "normalHddColor", "_normalHddColor", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "warningHddColor", "_warningHddColor", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "critialHddColor", "_critialHddColor", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "warningHddTemp", "_warningHddTemp", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "criticalHddTemp", "_criticalHddTemp", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "pMount", "_pMountActive", this._on_setting_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "hddTemp", "_hddTempActive", this._on_setting_changed, null);

            this.settings.bindProperty(Settings.BindingDirection.IN, "openSystem", "_openSystem", this._onTypeOpenChanged, null);

          } catch (e) {
              global.logError(e);
          }
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
           for (let n = 0; n < keys.length; n++) {
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
           }
           catch(e) {
             Main.notifyError("Error:", e.message);
           }
        },

        print_all_device: function() {
          try {
           let client = new GUdev.Client({subsystems: []});
           let enumerator = new GUdev.Enumerator({client: client});
           enumerator.add_match_subsystem('b*');

           let devices = enumerator.execute();

           for (let n=0; n < devices.length; n++) {
              let device = devices[n];
              this.print_device(device);
           }
          }
          catch(e) {
             Main.notifyError("Inf:", e.message);
          }
        },
*/

}
        
function main(metadata, desklet_id){
	let desklet = new MyDesklet(metadata, desklet_id);
	return desklet;
}
