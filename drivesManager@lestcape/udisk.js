#!/usr/bin/gjs


// Desklet : Drives Manager         Version      : v1.1-RTM
// O.S.    : Cinnamon               Release Date : 30 October 2013.
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

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;

const UDisksDriveInterface = <interface name="org.freedesktop.UDisks2.Drive">
    <method name="Eject">
        <arg type="a{sv}" name="options" direction="in"/>
    </method>
    <method name="SetConfiguration">
        <arg type="a{sv}" name="value" direction="in"/>
        <arg type="a{sv}" name="options" direction="in"/>
    </method>
    <method name="PowerOff">
        <arg type="a{sv}" name="options" direction="in"/>
    </method>
    <property type="s" name="Vendor" access="read"/>
    <property type="s" name="Model" access="read"/>
    <property type="s" name="Revision" access="read"/>
    <property type="s" name="Serial" access="read"/>
    <property type="s" name="WWN" access="read"/>
    <property type="s" name="Id" access="read"/>
    <property type="a{sv}" name="Configuration" access="read"/>
    <property type="s" name="Media" access="read"/>
    <property type="as" name="MediaCompatibility" access="read"/>
    <property type="b" name="MediaRemovable" access="read"/>
    <property type="b" name="MediaAvailable" access="read"/>
    <property type="b" name="MediaChangeDetected" access="read"/>
    <property type="t" name="Size" access="read"/>
    <property type="t" name="TimeDetected" access="read"/>
    <property type="t" name="TimeMediaDetected" access="read"/>
    <property type="b" name="Optical" access="read"/>
    <property type="b" name="OpticalBlank" access="read"/>
    <property type="u" name="OpticalNumTracks" access="read"/>
    <property type="u" name="OpticalNumAudioTracks" access="read"/>
    <property type="u" name="OpticalNumDataTracks" access="read"/>
    <property type="u" name="OpticalNumSessions" access="read"/>
    <property type="i" name="RotationRate" access="read"/>
    <property type="s" name="ConnectionBus" access="read"/>
    <property type="s" name="Seat" access="read"/>
    <property type="b" name="Removable" access="read"/>
    <property type="b" name="Ejectable" access="read"/>
    <property type="s" name="SortKey" access="read"/>
    <property type="b" name="CanPowerOff" access="read"/>
    <property type="s" name="SiblingId" access="read"/>
</interface>;
const UDisksDriveProxy = Gio.DBusProxy.makeProxyWrapper(UDisksDriveInterface);

const UDisksDriveAtaInterface = <interface name="org.freedesktop.UDisks2.Drive.Ata">
    <method name="SmartUpdate">
        <arg type="a{sv}" name="options" direction="in"/>
    </method>
    <method name="SmartGetAttributes">
        <arg type="a{sv}" name="options" direction="in"/>
        <arg type="a(ysqiiixia{sv})" name="attributes" direction="out"/>
    </method>
    <method name="SmartSelftestStart">
        <arg type="s" name="type" direction="in"/>
        <arg type="a{sv}" name="options" direction="in"/>
    </method>
    <method name="SmartSelftestAbort">
        <arg type="a{sv}" name="options" direction="in"/>
    </method>
    <method name="SmartSetEnabled">
        <arg type="b" name="value" direction="in"/>
        <arg type="a{sv}" name="options" direction="in"/>
    </method>
    <method name="PmGetState">
        <arg type="a{sv}" name="options" direction="in"/>
        <arg type="y" name="state" direction="out"/>
    </method>
    <method name="PmStandby">
        <arg type="a{sv}" name="options" direction="in"/>
    </method>
    <method name="PmWakeup">
        <arg type="a{sv}" name="options" direction="in"/>
    </method>
    <method name="SecurityEraseUnit">
        <arg type="a{sv}" name="options" direction="in"/>
    </method>
    <property type="b" name="SmartSupported" access="read"/>
    <property type="b" name="SmartEnabled" access="read"/>
    <property type="t" name="SmartUpdated" access="read"/>
    <property type="b" name="SmartFailing" access="read"/>
    <property type="t" name="SmartPowerOnSeconds" access="read"/>
    <property type="d" name="SmartTemperature" access="read"/>
    <property type="i" name="SmartNumAttributesFailing" access="read"/>
    <property type="i" name="SmartNumAttributesFailedInThePast" access="read"/>
    <property type="x" name="SmartNumBadSectors" access="read"/>
    <property type="s" name="SmartSelftestStatus" access="read"/>
    <property type="i" name="SmartSelftestPercentRemaining" access="read"/>
    <property type="b" name="PmSupported" access="read"/>
    <property type="b" name="PmEnabled" access="read"/>
    <property type="b" name="ApmSupported" access="read"/>
    <property type="b" name="ApmEnabled" access="read"/>
    <property type="b" name="AamSupported" access="read"/>
    <property type="b" name="AamEnabled" access="read"/>
    <property type="i" name="AamVendorRecommendedValue" access="read"/>
    <property type="b" name="WriteCacheSupported" access="read"/>
    <property type="b" name="WriteCacheEnabled" access="read"/>
    <property type="i" name="SecurityEraseUnitMinutes" access="read"/>
    <property type="i" name="SecurityEnhancedEraseUnitMinutes" access="read"/>
    <property type="b" name="SecurityFrozen" access="read"/>
</interface>;
const UDisksDriveAtaProxy = Gio.DBusProxy.makeProxyWrapper(UDisksDriveAtaInterface);

// Poor man's async.js
const Async = {
    // mapping will be done in parallel
    map: function(arr, mapClb /* function(in, successClb)) */, resClb /* function(result) */) {
        let counter = arr.length;
        let result = [];
        for (let i = 0; i < arr.length; ++i) {
            mapClb(arr[i], (function(i, newVal) {
                result[i] = newVal;
                if (--counter == 0) resClb(result);
            }).bind(null, i)); // i needs to be bound since it will be changed during the next iteration
        }
    }
}

function debug(str){
    //tail -f -n100 ~/.cache/gdm/session.log | grep temperature
    print ('LOG temperature@xtranophilist: ' + str);
}

// routines for handling of udisks2
const UDisks = {
    // creates a list of sensor objects from the list of proxies given
    create_list_from_proxies: function(proxies) {
        print("Estoy1");
        return proxies.filter(function(proxy) {
            // 0K means no data available
            print("Estoy");
            return proxy.ata.SmartTemperature > 0;
        }).map(function(proxy) {
            return {
                label: proxy.drive.Model,
                temp: proxy.ata.SmartTemperature - 272.15
            };
        });
    },

    // calls callback with [{ drive: UDisksDriveProxy, ata: UDisksDriveAtaProxy }, ... ] for every drive that implements both interfaces
    get_drive_ata_proxies: function(callback) {
        Gio.DBusObjectManagerClient.new(Gio.DBus.system, 0, "org.freedesktop.UDisks2", "/org/freedesktop/UDisks2", null, null, function(src, res) {
        //Gio.DBusObjectManagerClient.new_for_bus(Gio.BusType.SYSTEM, 0, "org.freedesktop.UDisks2", "/org/freedesktop/UDisks2", null, null, function(src, res) {
            try {
               print("llego");
                let objMgr = Gio.DBusObjectManagerClient.new_finish(res); //might throw

                let objPaths = objMgr.get_objects().filter(function(o) {
                    return o.get_interface("org.freedesktop.UDisks2.Drive") != null
                        && o.get_interface("org.freedesktop.UDisks2.Drive.Ata") != null;
                }).map(function(o) { return o.get_object_path() });
                // now create the proxy objects, log and ignore every failure
                Async.map(objPaths, function(obj, callback) {
                    // create the proxies object
                    let driveProxy = new UDisksDriveProxy(Gio.DBus.system, "org.freedesktop.UDisks2", obj, function(res, error) {
                        if (error) { //very unlikely - we even checked the interfaces before!
                            debug("Could not create proxy on "+obj+":"+error);
                            callback(null);
                            return;
                        }
                        let ataProxy = new UDisksDriveAtaProxy(Gio.DBus.system, "org.freedesktop.UDisks2", obj, function(res, error) {
                            if (error) {
                                debug("Could not create proxy on "+obj+":"+error);
                                callback(null);
                                return;
                            }

                            callback({ drive: driveProxy, ata: ataProxy });
                        });
                    });
                }, function(proxies) {
                    // filter out failed attempts == null values
                    callback(proxies.filter(function(a) { return a != null; }));
                });
            } catch (e) {
                print(e);
                debug("Could not find UDisks objects: "+e);
            }
        });
    },

    ref: function(manager, object_path, interface_name, user_data) {
       return null;
    }
};


//defclasss
function HDDTempProxy() {
   this._init();
}

HDDTempProxy.prototype = {

   _init: function() {
        this.udisksProxies = [];
        UDisks.get_drive_ata_proxies((function(proxies) {
            this.udisksProxies = proxies;
            print(proxies);
            this._updateDisplay(this._sensorsOutput, this._hddtempOutput);
        }).bind(this));

        //this._settingsChanged = settings.connect("changed", Lang.bind(this,function(){ this._querySensors(false); }));

        this._querySensors(true);
   },

   _retTempInfo: function() {
      //let tempInfo = tempInfo.concat(UDisks.create_list_from_proxies(this.udisksProxies));
      //tempInfo.sort(function(a,b) { return a['label'].localeCompare(b['label']) });
   },

   _getUdisksLabels: function() {
        UDisks.get_drive_ata_proxies((function(proxies) {
            this.list = UDisks.create_list_from_proxies(proxies);

            //this._appendMultipleItems(list);
        }).bind(this));
    },

    _updateDisplay: function(sensors_output, hddtemp_output) {
        
    },

    _querySensors: function(recurse) {
       let list = UDisks.create_list_from_proxies(this.udisksProxies);//this._getUdisksLabels();
       for(let i in list) {
          print("Fue");
          print(list[i]);
       }
    }
};

try {
  let hddtemp = new HDDTempProxy();
  hddtemp._querySensors(true);
} catch(e) {
  print(e.message);
}

