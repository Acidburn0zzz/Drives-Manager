
// Drives Manager Cinnamon Desklet v0.1 - 24 June 2013
//
// This is a desklet to display the current drives pluged to the computer.
// We can used the avility to show the volumens of the drive, also indicate
// if the volumens is mount. For the mount volumen if is removable, you can
// mount and unmount the volumen. If the volumen is mount, you can access
// directly with left click in to the icon driver. Configuration for all option
// is in shema format, and is accesible for the cinnamon settings or directly
// with rigth click in desklet.
//
// Lester
// desklets

const Gio = imports.gi.Gio;
const St = imports.gi.St;

const Desklet = imports.ui.desklet;

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Settings = imports.ui.settings;
const CinnamonMountOperation = imports.ui.cinnamonMountOperation;
const Cinnamon = imports.gi.Cinnamon;
const Main = imports.ui.main;

function MyDesklet(metadata){
    this._init(metadata);
}

MyDesklet.prototype = {

	__proto__: Desklet.Desklet.prototype,

	_init: function(metadata){
	   Desklet.Desklet.prototype._init.call(this, metadata);
	   this.uuid = "drivesManager@vampire";
	   this.metadata = metadata
	   this.dateFormat = this.metadata["dateFormat"];
	   this.dateSize = this.metadata["dateSize"];
	   this.timeFormat = this.metadata["timeFormat"];
	   this.timeSize = this.metadata["timeSize"];

           // this._date = new St.Label();
           //this._time = new St.Label();

	   this.setHeader(_("Drivers Mount"));
	
	   // Set the font sizes from .json file
	
	   //this._date.style="font-size: " + this.dateSize;
	   //this._time.style="font-size: " + this.timeSize;
	
           this.configFile = this._pathToComponent("metadata.json", "");
           this.helpFile = this._pathToComponent("README", "");
	   global.log("Config file " + this.configFile);
	
	   this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

	   this._menu.addAction(_("Configure"), Lang.bind(this, function() {
              Util.spawn(['cinnamon-settings', 'desklets', this.uuid]);
	   }));
	
	   this._menu.addAction(_("Help"), Lang.bind(this, function() {
	      Util.spawnCommandLine("xdg-open " + this.helpFile);
	   }));
	   /*New*/
           this.drives = [];
           this.mountsHard = [];
           this.drivesRemovables = [];
           this.namesRemovables = [];
           this.show_hdd = true;
           this.show_empty = true;		
           this.monitor = Gio.VolumeMonitor.get();
          // this.monitor.connect('mount-added', this._addDrives);
          // this.monitor.connect('mount-removed', this._del_drive);
           /*End New*/
           this._initSettings();
           //this._timeout = null;
           this._updateDate();
	},

	on_desklet_removed: function() {
           if(this._timeout > 0)
	      Mainloop.source_remove(this._timeout);
	},

	_updateDate: function() {
	   // let timeFormat = '%H:%M';
	   // let dateFormat = '%A,%e %B';
	   //let displayDate = new Date();

	   //this._time.set_text(displayDate.toLocaleFormat(this.timeFormat));
	   //this._date.set_text(displayDate.toLocaleFormat(this.dateFormat));
		
	   this._timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._updateDate));
	   /*new*/
           this._addDrives();
           /*EndNew*/
	},

        _getIconImage: function(pathC) {
           try {
             let file = Gio.file_new_for_path(pathC);
             let icon_uri = file.get_uri();
             //return St.TextureCache.get_default().load_uri_sync(1, icon_uri, 64, 64);
              return St.TextureCache.get_default().load_uri_async(icon_uri, 1064, 1064);
           }catch(e) {
	     this._reportFailure(e);
	   }        
        },

        _getMeterImage: function(size, used) {
           let _imageNumber = (used/size)*10 + 1;
           _imageNumber = Math.floor(Math.round(_imageNumber));
           return this._getIconImage(this._pathToComponent("meter" + _imageNumber + ".png", "meter/"));
        },

        _isRemovable: function(drive) {
           return (this._findRemovablesName(drive) != "");
        },

        _findRemovablesName: function(drive) {
           for (let i = 0; i < this.drivesRemovables.length; i++)
           {
              if(this.drivesRemovables[i] == drive.get_name())
                 return this.namesRemovables[i];
           }
           return "";
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

        _findMountHardOfIcon: function(bt) {
           for (let i = 0; i < this.mountsHard.length; i++)
           {
              if(this.listHardIcon[i] == bt)
                 return this.mountsHard[i];
           }
           return null;
         },

        _addRemovable: function(drive, realName) {
           let _exist = false;
           for (let i = 0; i < this.drivesRemovables.length; i++)
           {
              if(this.drivesRemovables[i] == drive.get_name())
              {
                 _exist = true;
                 break;
              }
           }
           if(_exist == false)
           {
              this.drivesRemovables.push(drive.get_name());
              this.namesRemovables.push(realName);
           }
        },

        _deleteRemovable: function() {
           let _exist = false;
           for (let i = 0; i < this.drivesRemovables.length; i++)
           {
              _exist = false;
              for (let j = 0; j < this.drives.length; j++)
              {
                 if(this.drivesRemovables[i] == this.drives[j].get_name())
                 {
                    _exist = true;
                    break;
                 }
              }
              if(_exist == false)
              {
                this.drivesRemovables.splice(i, 1);
                this.namesRemovables.splice(i, 1);
                i--;
              }
           }
        },

        _createFrame: function() {
           this._deskletFrame = new St.Bin({x_align: St.Align.START});
           if(this._showMainBox)
              this._deskletFrame.set_style('padding: 10px; border: 2px solid #ffffff; background-color: rgba(0, 0, 0, 0.7); border-radius: 12px;');
           let _rootContainer = new St.BoxLayout({ width: 170, vertical:true, style_class: 'root-container'});
           this._deskletFrame.set_child(_rootContainer);
           this.setContent(this._deskletFrame);
           return _rootContainer;
        },
        
        _createDriveContainer: function() {
           let _driveContainer = new St.BoxLayout({vertical:false});
           if(this._showDriveBox)
           {
              if(this._showDriveBoxTheme)
                 _driveContainer.set_style('background-image: url("' + this._pathToComponent("bg.png", "theme/" + this._theme + "/") + '");' + ' padding: 0px 30px 0px 0px;');
              else
                 _driveContainer.set_style('padding: 0px 30px 0px 0px; border: 2px solid #ffffff; background-color: rgba(0, 0, 0, 0.7); border-radius: 12px;');
           }
           return _driveContainer;
        },

        _addDrives: function() {
           let _rootContainer = this._createFrame();
            
           this.drives = [];
           this.listButtonIcon = [];
           this.listButtonEject = [];

           if(this._showHardDrives)
              this._addHardDrive(_rootContainer);
           if(this._showRemovableDrives) {
              this._addDrivesMount(_rootContainer);
              this._addDrivesRemovable(_rootContainer);
           }
           if(this._showUnmountVolumes)
              this._addDrivesUnMount(_rootContainer);
           if(this._showEmptyDrives)
              this._addDrivesEmpty(_rootContainer);

           this._deleteRemovable();

           /*Add text*/
          // let _imgR = this._loadImage(this._pathToComponent("-bg5.png", "image/background/");
           //this._deskletFrame.set_child(_imgR);
          // this._deskletFrame.add_child(_imgR);
        },

        _loadImage: function(filePath) {
           try {
              let file = Gio.file_new_for_path(filePath);
              let uri = file.get_uri();

              let image = St.TextureCache.get_default().load_uri_sync(St.TextureCachePolicy.FOREVER, uri, this.width, this.height);

              let frameRatio = this.height/this.width;
              let imageRatio = image.height/image.width;

              let height, width;            
              if (frameRatio > imageRatio) {
                 width = this.width;
                 height = width * imageRatio;
              } else {
                 height = this.height;
                 width = height / imageRatio;
              }

              image.set_size(width, height);

              image._path = filePath;
              //this._images.push(image);
	      return image;
           } catch (x) {
              return null;
              // Do nothing. Probably a non-image is in the folder
           }
        },

        _addHardDrive: function(_rootContainer) {
           let [res, out, err, status] = GLib.spawn_command_line_sync('df');
           let mount_lines = out.toString().split("\n");
           this.mountsHard = [];
           this.listHardIcon = [];
           for(let mount_line in mount_lines) {
              let mount = mount_lines[mount_line].toString().split(/\s+/);
              if(mount[0].indexOf("/dev/") == 0) {
                 if(mount[5].substring(0,6) != "/media") {
                    let _mount = [];
                    _mount.push(mount[0]);
                    _mount.push(1024*mount[1]);
                    _mount.push(1024*mount[2]);
                    _mount.push(1024*mount[3]);
                    _mount.push(mount[4]);
                    _mount.push(mount[5]);
                    this.mountsHard.push(_mount);
                 }
              }
           }

           for (let mount in this.mountsHard) {
              let _driveIcon = this._getIconImage(this._pathToComponent("disk.png", "theme/" + this._theme + "/"));
              let _driveButton = new St.Button({ child: _driveIcon });
              _driveButton.connect('clicked', Lang.bind(this, this._onMountHardClicked));
              let _iconContainer = new St.BoxLayout({vertical:true, style_class: 'icon-container'});
              _iconContainer.add(_driveButton);
              let _infoContainer = new St.BoxLayout({vertical:true, style_class: 'info-container'});
              let _nameContainer = new St.BoxLayout({vertical:false, style_class: 'name-container'});
              let _name = new St.Label();
              _name.style="font-size: " + this.dateSize;
              _name.set_text(this.mountsHard[mount][5] + " " + this.mountsHard[mount][0]);
              _nameContainer.add(_name);
              _infoContainer.add(_nameContainer, {x_fill: false, x_align: St.Align.MIDDLE});

              let _capacityContainer = new St.BoxLayout({vertical:false, style_class: 'capacity-container'});
              let _percentContainer = new St.BoxLayout({vertical:false, style_class: 'percent-container'});
              let _capacity = new St.Label();
              _capacity.style="font-size: " + this.timeSize;
              let u = this.mountsHard[mount][2];
              let s = this.mountsHard[mount][1];
              _capacity.set_text("" + this._convertToString(u) + "/" + this._convertToString(s));
              _capacityContainer.add(_capacity);
              let _meterIcon = this._getMeterImage(s, u);
              _percentContainer.add(_meterIcon);
              _infoContainer.add(_percentContainer, {x_fill: false, x_align: St.Align.MIDDLE});
              _infoContainer.add(_capacityContainer, {x_fill: false, x_align: St.Align.MIDDLE});

              let _driveContainer = this._createDriveContainer();
              _driveContainer.add(_iconContainer, {x_fill: false, x_align: St.Align.START});
              _driveContainer.add(_infoContainer, {x_fill: false, x_align: St.Align.MIDDLE});
              _rootContainer.add(_driveContainer, {x_fill: false, x_align: St.Align.START});

              this.listHardIcon.push(_driveButton);
           }
        },

        _addDrivesMount: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if(_listDrives[i]) 
              {
                 if(_listDrives[i].has_volumes())
                 {
                    let _listVols = _listDrives[i].get_volumes();
                    for (let j = 0; j < _listVols.length; j++)
                    {
                       let _mounts = _listVols[j].get_mount();
                       if(_mounts)
                       {
                          this._addRemovable(_listDrives[i], _mounts.get_name());
                          //let _root = _mounts.get_root();
                          let _infoContainer = new St.BoxLayout({vertical:true, style_class: 'info-container'});
                          let _nameContainer = new St.BoxLayout({vertical:false, style_class: 'name-container'});
                          let _capacityContainer = new St.BoxLayout({vertical:false, style_class: 'capacity-container'});
                          let _percentContainer = new St.BoxLayout({vertical:false, style_class: 'percent-container'});

                          let _name = new St.Label();
                          let _capacity = new St.Label();

                          _name.style="font-size: " + this.dateSize;
              		  _capacity.style="font-size: " + this.timeSize;
                          _name.set_text(_mounts.get_name());
                          let s = this._driverSize(_mounts);
                          let u = this._driverUsedSpace(_mounts);
		          _capacity.set_text("" + this._convertToString(u) + "/" + this._convertToString(s));
                          _nameContainer.add(_name);
                          _capacityContainer.add(_capacity);
                          let _driveIcon;
                          let _meterIcon;
                          if(s > 0)
                          {
                             _meterIcon = this._getMeterImage(s, u);
                             //_meterIcon.icon_heigth = 200; //, icon_size: 100
                             _percentContainer.add(_meterIcon);
                             _driveIcon = this._getIconImage(this._pathToComponent("usb.png", "theme/" + this._theme + "/"));
                          }
                          else
                          {
                             _driveIcon = this._getIconImage(this._pathToComponent("cdrom.png", "theme/" + this._theme + "/"));
                          }
                          let _driveButton = new St.Button({ child: _driveIcon });
                          _driveButton.connect('clicked', Lang.bind(this, this._onDriveClicked));
                          let _iconContainer = new St.BoxLayout({vertical:true, style_class: 'icon-container'});
                          _iconContainer.add(_driveButton);

                          _infoContainer.add(_nameContainer, {x_fill: false, x_align: St.Align.MIDDLE});
		          _infoContainer.add(_capacityContainer, {x_fill: false, x_align: St.Align.MIDDLE});
                          _infoContainer.add(_percentContainer, {x_fill: false, x_align: St.Align.MIDDLE});

                          let _ejectContainer = new St.BoxLayout({vertical:false, style_class: 'eject-container'});
                          //let _ejectIcon = new St.Icon({ icon_name: 'media-eject', icon_type: St.IconType.SYMBOLIC, style_class: 'popup-menu-icon' });
                          let _ejectIcon = this._getIconImage(this._pathToComponent("eject.png", "theme/" + this._theme + "/"));
                          let _ejectButton = new St.Button({ child: _ejectIcon });
                          _ejectButton.connect('clicked', Lang.bind(this, this._onDriveEject));
                          _ejectContainer.add(_ejectButton);

                          let _driveContainer = this._createDriveContainer();
                          _driveContainer.add(_iconContainer, {x_fill: false, x_align: St.Align.START});
                          _driveContainer.add(_infoContainer, {x_fill: false, x_align: St.Align.MIDDLE});
                          _driveContainer.add(_ejectContainer, {x_fill: false, x_align: St.Align.END});
                          _rootContainer.add(_driveContainer, {x_fill: false, x_align: St.Align.START});
                          this.drives.push(_listDrives[i]);
                          this.listButtonIcon.push(_driveButton);
                          this.listButtonEject.push(_ejectButton);
                       }
                    }
                 }
              }
           }
        },

        _addDrivesRemovable: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if(_listDrives[i]) 
              {
                 if((!_listDrives[i].has_volumes())&&(_listDrives[i].can_poll_for_media()))
                 {
                    if((this._isRemovable(_listDrives[i]))||(_listDrives[i].has_media()))
                    {
                       let _driveIcon = this._getIconImage(this._pathToComponent("usb.png", "theme/" + this._theme + "/"));
                       let _iconContainer = new St.BoxLayout({vertical:true, style_class: 'icon-container'});
                       _iconContainer.add(_driveIcon);
                       let _infoContainer = new St.BoxLayout({vertical:true, style_class: 'info-container'});
                       let _nameContainer = new St.BoxLayout({vertical:false, style_class: 'name-container'});
                       let _name = new St.Label();
                       _name.style="font-size: " + this.dateSize;
                       _name.set_text(this._findRemovablesName(_listDrives[i]));
                       _nameContainer.add(_name);
                       _infoContainer.add(_nameContainer, {x_fill: false, x_align: St.Align.MIDDLE});

                       let _ejectContainer = new St.BoxLayout({vertical:false, style_class: 'eject-container'});
                       //let _ejectIcon = new St.Icon({ icon_name: 'media-eject', icon_type: St.IconType.SYMBOLIC, style_class: 'popup-menu-icon' });
                       let _ejectIcon = this._getIconImage(this._pathToComponent("inject.png", "theme/" + this._theme + "/"));
                       let _ejectButton = new St.Button({ child: _ejectIcon });
                       _ejectButton.connect('clicked', Lang.bind(this, this._onDriveRemount));
                       _ejectContainer.add(_ejectButton);

                       let _driveContainer = this._createDriveContainer();
                       _driveContainer.add(_iconContainer, {x_fill: false, x_align: St.Align.START});
                       _driveContainer.add(_infoContainer, {x_fill: false, x_align: St.Align.MIDDLE});
                       _driveContainer.add(_ejectContainer, {x_fill: false, x_align: St.Align.END});
                       _rootContainer.add(_driveContainer, {x_fill: false, x_align: St.Align.START});
                       this.drives.push(_listDrives[i]);
                       this.listButtonIcon.push(null);
                       this.listButtonEject.push(_ejectButton);
                    }
                 }
              }
           }
        },

        _addDrivesUnMount: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if(_listDrives[i]) 
              {
                 if(_listDrives[i].has_volumes())
                 {
                    let _listVols = _listDrives[i].get_volumes();
                    for (let j = 0; j < _listVols.length; j++)
                    {
                       let _mounts = _listVols[j].get_mount();
                       if((!_mounts)&&(this.show_hdd))
                       {
                          let _driveIcon = this._getIconImage(this._pathToComponent("drive.png", "theme/" + this._theme + "/"));
                          let _iconContainer = new St.BoxLayout({vertical:true, style_class: 'icon-container'});
                          _iconContainer.add(_driveIcon);
                          let _infoContainer = new St.BoxLayout({vertical:true, style_class: 'info-container'});
                          let _nameContainer = new St.BoxLayout({vertical:false, style_class: 'name-container'});
                          let _name = new St.Label();
                          _name.style="font-size: " + this.dateSize;
                          _name.set_text(_listDrives[i].get_name());
                          _nameContainer.add(_name);
                          _infoContainer.add(_nameContainer, {x_fill: false, x_align: St.Align.MIDDLE});

                          let _ejectContainer = new St.BoxLayout({vertical:false, style_class: 'eject-container'});
                         // let _ejectIcon = new St.Icon({ icon_name: 'media-eject', icon_type: St.IconType.SYMBOLIC, style_class: 'popup-menu-icon' });
                          let _ejectIcon = this._getIconImage(this._pathToComponent("inject.png", "theme/" + this._theme + "/"));
                          let _ejectButton = new St.Button({ child: _ejectIcon });
                          _ejectButton.connect('clicked', Lang.bind(this, this._onDriveRemount));
                          _ejectContainer.add(_ejectButton);

                          let _driveContainer = this._createDriveContainer();
                          _driveContainer.add(_iconContainer, {x_fill: false, x_align: St.Align.START});
                          _driveContainer.add(_infoContainer, {x_fill: false, x_align: St.Align.MIDDLE});
                          _driveContainer.add(_ejectContainer, {x_fill: false, x_align: St.Align.END});
                          _rootContainer.add(_driveContainer, {x_fill: false, x_align: St.Align.START});
                          this.drives.push(_listDrives[i]);
                          this.listButtonIcon.push(null);
                          this.listButtonEject.push(_ejectButton);
                       }
                    }  
                 }
              }
           }
        },

        _addDrivesEmpty: function(_rootContainer) {
           let _listDrives = this.monitor.get_connected_drives();

           for (let i = 0; i < _listDrives.length; i++)
           {
              if(_listDrives[i]) 
              {
                 if((!_listDrives[i].has_volumes())&&(_listDrives[i].can_poll_for_media()))
                 {
                    if((!((this._isRemovable(_listDrives[i])))||(_listDrives[i].has_media()))&&(this.show_empty))
                    {
                       let _driveIcon = this._getIconImage(this._pathToComponent("empty.png", "theme/" + this._theme + "/"));
                       let _iconContainer = new St.BoxLayout({vertical:true, style_class: 'icon-container'});
                       _iconContainer.add(_driveIcon);
                       let _infoContainer = new St.BoxLayout({vertical:true, style_class: 'info-container'});
                       let _nameContainer = new St.BoxLayout({vertical:false, style_class: 'name-container'});
                       let _name = new St.Label();
                       _name.style="font-size: " + this.dateSize;
                       _name.set_text(_listDrives[i].get_name());
                       _nameContainer.add(_name);
                       _infoContainer.add(_nameContainer, {x_fill: false, x_align: St.Align.MIDDLE});

                       let _driveContainer = this._createDriveContainer();
                       _driveContainer.add(_iconContainer, {x_fill: false, x_align: St.Align.START});
                       _driveContainer.add(_infoContainer, {x_fill: false, x_align: St.Align.MIDDLE});
                       _rootContainer.add(_driveContainer, {x_fill: false, x_align: St.Align.START});
                       this.drives.push(_listDrives[i]);
                       this.listButtonIcon.push(null);
                       this.listButtonEject.push(null);
                    }
                 }
              }
           }
        },
   
        _driverSize: function(deviceMount) {
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

        _driverUsedSpace: function(deviceMount) {
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

        _driverType: function(deviceMount) {
        },

        _driverPath: function(deviceMount) {
           return deviceMount.get_root().get_path();
	},

        _isDiscBlank: function(deviceMount) {
           let activation_uri = deviceMount.get_root().get_uri();
           if (activation_uri.has_prefix("burn://"))
              return true;
	   return false;
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

        _del_drive: function(deviceMount) {
           this.drives.remove(deviceMount);
        },

        _unmountFinish: function(mount, result) {
           try {
              mount.unmount_with_operation_finish(result);
           } catch(e) {
              this._reportFailure(e);
           }
        },

        _ejectFinish: function(mount, result) {
           try {
             mount.eject_with_operation_finish(result);
           } catch(e) {
             this._reportFailure(e);
           }
        },

        _volumeMountedFinish: function(volume, result) {
           try {
              volume.mount_finish(result);
    	   } catch (e) {
              this._reportFailure(e);
           }
        },

        _onDriveEject: function(bt) {
           let _listVols = this._findDriveOfEject(bt).get_volumes();
           let mountOp = new CinnamonMountOperation.CinnamonMountOperation(_listVols[0].get_mount());
           if (_listVols[0].get_mount().can_eject())
              _listVols[0].get_mount().eject_with_operation(Gio.MountUnmountFlags.NONE, mountOp.mountOp, null, Lang.bind(this, this._ejectFinish));   
           else
              _listVols[0].get_mount().unmount_with_operation(Gio.MountUnmountFlags.NONE, mountOp.mountOp, null, Lang.bind(this, this._unmountFinish));
        },

        _onDriveRemount: function(bt) {
           try {
              let _listVols = this._findDriveOfEject(bt).get_volumes();
              if(_listVols.length == 0)
                Util.spawnCommandLine("nemo " + "/home");
              let operation = new CinnamonMountOperation.CinnamonMountOperation(_listVols[0]);
             /* if (_listVols[0].get_mount().can_eject())
                 _listVols[0].get_mount().eject_with_operation(Gio.MountUnmountFlags.NONE, mountOp.mountOp, null, Lang.bind(this, this._ejectFinish));   
              else*/
                _listVols[0].mount(0, operation.mountOp, null, Lang.bind(this, this._volumeMountedFinish));
                //_listVols[0].get_mount().mount_unmount_with_operation(Gio.MountUnmountFlags.NONE, mountOp.mountOp, null, Lang.bind(this, this._remountFinish));
           }
           catch(e) {
              this._reportFailure(e);
           }
           //Util.spawnCommandLine("nemo " + "/home");
        },

        _onDriveClicked: function(bt) {
           let _listVols = this._findDriveOfIcon(bt).get_volumes();
           //for (let j = 0; j < _listVols.length; j++)
           let urlPath = this._driverPath(_listVols[0].get_mount());
           Util.spawnCommandLine("nemo " + urlPath);
        },

        _onMountHardClicked: function(bt) {
           let _hardDrive = this._findMountHardOfIcon(bt);
           //for (let j = 0; j < _listVols.length; j++)
           let urlPath = _hardDrive[5];
           Util.spawnCommandLine("nemo " + urlPath);
        },

        _on_setting_changed: function() {
           if(this._timeout > 0)
              Mainloop.source_remove(this._timeout);
           this._timeout = null;
           this._deskletFrame.destroy();
           this._addDrives();
           this._updateDate();
        },

        _path: function() {
           return GLib.get_home_dir()+ "/.local/share/cinnamon/desklets/" + this.uuid + "/";
        },

        _pathToComponent: function(name, location) {
           return this._path() + location + name;
        },

        _reportFailure: function(exception) {
	   Main.notifyError("Drives failed:", exception.message);
        },
        
        _initSettings: function(){
          try {
            this.settings = new Settings.DeskletSettings(this, this.metadata["uuid"], this.instance_id);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "mainBox",
                                     "_showMainBox",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "driveBox",
                                     "_showDriveBox",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "driveBoxTheme",
                                     "_showDriveBoxTheme",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "theme",
                                     "_theme",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "hardDrives",
                                     "_showHardDrives",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "removableDrives",
                                     "_showRemovableDrives",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "unmountVolumes",
                                     "_showUnmountVolumes",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "emptyDrives",
                                     "_showEmptyDrives",
                                     this._on_setting_changed,
                                     null);
            
            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "fade-delay",
                                     "fade_delay",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "directory",
                                     "dir",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                      "shuffle",
                                      "shuffle",
                                      this._on_setting_changed,
                                      null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "delay",
                                     "delay",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "height",
                                     "height",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "width",
                                     "width",
                                     this._on_setting_changed,
                                     null);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "quality",
                                     "quality",
                                     this._on_setting_changed,
                                     null);
          } catch (e) {
              global.logError(e);
          }
       }

}
        
function main(metadata, desklet_id){
	let desklet = new MyDesklet(metadata, desklet_id);
	return desklet;
}
