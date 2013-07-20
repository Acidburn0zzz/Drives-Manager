const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;

function Translator(uuid) {
	this._init(uuid);
}

Translator.prototype = {
	
	_init: function(_uuid) {
           this.uuid = _uuid;
	},

        _getDefaultLanguage: function() {
           let [res, out, err, status] = GLib.spawn_command_line_sync('locale');
           let _lines = out.toString().split("\n");
           return result = _lines[0].substring(5, 7);
        },

	_getLanguage: function()
	{
           let token = [];
           let _defaultLang = this._getDefaultLanguage();
           let _file = Gio.file_new_for_path(this._path() + "lang/" + _defaultLang);
           if(!_file.query_exists(null))
             _defaultLang = "en";
           _file = Gio.file_new_for_path(this._path() + "lang/" + _defaultLang);
           if(_file.query_exists(null))
           {
              let _text = this._readFile(_file);
              let _lines = _text.split("\n");
              for (let _curr in _lines)
              {
                 let _pos = _lines[_curr].indexOf("=");
                 if(_pos != -1)
                 {
                    token[_lines[_curr].substring(0, _pos)] = _lines[_curr].substring(_pos+1, _lines[_curr].length);
                 }
              }
           }
           else
             Main.notifyError("File not exist");
           this._generateSettings(token);
           return token;
        },

        _generateSettings: function(token) {
           let _fileSkeleton = Gio.file_new_for_path(this._path() + "skeleton-settings-schema.json");
           let _fileSettings = Gio.file_new_for_path(this._path() + "settings-schema.json");
           if(_fileSkeleton.query_exists(null))
           {
              if(!_fileSettings.query_exists(null))
              {
                 try {
                    let _infoSkeleton = this._readFile(_fileSkeleton);
                    _infoSkeleton = _infoSkeleton.substring(0, _infoSkeleton.length-5);
                    for (key in token) {
                       while(_infoSkeleton.indexOf("$"+key+"$") != -1)
                          _infoSkeleton = _infoSkeleton.replace("$"+key+"$", token[key]);
                    }
                    this._writeFile(_fileSettings, _infoSkeleton);
                    this._configReplace();
                 } catch(e) {
                    Main.notifyError("Error: "+ e.message);
                 }
              }
           }
        },

        _readFile: function(file) {
           try {
             let fstream = file.read(null);
             let dstream = new Gio.DataInputStream.new(fstream);
             let data = dstream.read_until("", null);
             fstream.close(null);
             return data.toString();
           }
           catch(e) {
             Main.notifyError("Error:", e.message);
           }
        },

        _writeFile: function(file, textLine) {
           try {
              let fstream = file.replace("", false, Gio.FileCreateFlags.NONE, null);
              let dstream = new Gio.DataOutputStream.new(fstream);   

              dstream.put_string(textLine, null);
              fstream.close(null);
           }
           catch(e) {
             Main.notifyError("Error:", e.message);
           }
        },

        _path: function() {
           return GLib.get_home_dir()+ "/.local/share/cinnamon/desklets/" + this.uuid + "/";
        },

       _configReplace: function() {
           try {
              let _pathToConfig = GLib.get_home_dir()+ "/.local/share/cinnamon/desklets/" + this.uuid + "/settings-schema.json";
              GLib.spawn_command_line_sync("iconv -f iso-8859-1 -t utf-8 '" + _pathToConfig + "' -o '" + _pathToConfig + "'");
              //global.reexec_self();
           }
           catch(e) {
             Main.notifyError("Error:", e.message);
           }
        }
};
