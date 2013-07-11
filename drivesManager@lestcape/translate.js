const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
//const Encoding = imports.encoding;

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
             // let _text = this._utfToUnicode(this._readFile(_file));
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
           if(_defaultLang != "en")
              this._configReplace();
           //global.reexec_self();
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
                 } catch(e) {
                    Main.notifyError("Error: "+ e.message);
                 }
              }
           }
        },

        _configReplace: function(token) {
           try {
              let _pathToConfig = GLib.get_home_dir()+ "/.cinnamon/configs/" + this.uuid + "/" + this.uuid + ".json";
              GLib.spawn_command_line_sync("iconv -f iso-8859-1 -t utf-8 '" + _pathToConfig + "' -o '" + _pathToConfig + "'");
           }
           catch(e) {
             Main.notifyError("Error:", e.message);
           }
         /*  let _fileConfig = Gio.file_new_for_path(_pathToConfig);
           if(_fileConfig.query_exists(null))
           {
              let _infoConfig = _infoConfig = this._readFile(_fileConfig).substring(0, _infoSkeleton.length-5);
              _infoConfig =  this._utfToUnicode(_infoConfig);
              this._writeFile(_fileConfig+".bak", _infoConfig);
           }*/
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
        }
/* Meaby needed for only some characters unsoported by utf-8
        _utfToUnicode: function(utf) {
           let _unicode = utf;
           try {
              let character = [];
              character["\u00e1"] = "\\u00e1"; //á
              character["\u00e9"] = "\\u00e9"; //é
              character["\u00ed"] = "\\u00ed"; //í
              character["\u00f3"] = "\\u00f3"; //ó
              character["\u00fa"] = "\\u00fa"; //ú
              character["\u00c1"] = "\\u00c1"; //Á
              character["\u00c9"] = "\\u00c9"; //É
              character["\u00cd"] = "\\u00cd"; //Í
              character["\u00d3"] = "\\u00d3"; //Ó
              character["\u00da"] = "\\u00da"; //Ú
              character["\u00f1"] = "\\u00f1"; //ñ
              character["\u00d1"] = "\\u00d1"; //Ñ

              for (key in character) {
                 while(_unicode.indexOf(key) != -1)
                    _unicode = _unicode.replace(key, character[key]);
              }
           } catch(e) {
              Main.notifyError("Error: ", e.message);
           }
           return _unicode;
        }
*/
};
