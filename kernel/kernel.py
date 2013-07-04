#!/usr/bin/env python

# Drives Manager Cinnamon Desklet v0.1 - 24 June 2013 Lester Carballo Perez lestcape@gmail.com
#
# This is a desklet to display the current drives pluged to the computer.
# We can used the avility to show the volumens of the drive, also indicate
# if the volumens is mount. For the mount volumen if is removable, you can
# mount and unmount the volumen. If the volumen is mount, you can access
# directly with left click in to the icon driver. Configuration for all option
# is in shema format, and is accesible for the cinnamon settings or directly
# with rigth click in desklet.
#
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.

import os
import subprocess
import string
import re

class KernelInformer:
   def __init__(self):
     self.__fileLog = ".driverManagerLog"

   def wirteInformer(self):
     try:
        logfile = open(self.__fileLog, "a");
        try:
           _out = self.detectOptical();
           for i in range(len(_out)):
              for j in range(len(_out[i])):
	         logfile.write(_out[i][j] + ' ')
              logfile.write('\n');
	finally:
           logfile.close();
     except IOError:
        pass;

   def findIndex(self, arr, value):
      for index, item in enumerate(arr):
         if(item == value):
            return index;
      return -1;

   def subString(self, strCurrent, init, end):
      return strCurrent[init:end];

   def detectOptical(self):
      cmd = [ 'wodim', '--checkdrive' ];
      proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE);
      stdout, stderr = proc.communicate();
      output = "";
      if(proc.returncode != 0):
         output = stderr;
      else:
         output = stdout;

      opticalDrives = [];
      _opticalDrive = [];
      _outLines = string.split(output, "\n");
      for _line in range(len(_outLines)):
         _current = _outLines[_line];
         if(_current.find("Detected") != -1):
            _posDev = _current.find("/dev/");
            if(_posDev != -1):
               _currentValue = self.subString(_current, _posDev, len(_current));
               if(self.findIndex(_opticalDrive, _currentValue) == -1):
                  _opticalDrive.append(_currentValue);
     
      cmd = [ 'wodim', '--devices' ];
      proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE);
      stdout, stderr = proc.communicate();
      output = "";
      if(proc.returncode != 0):
         output = stderr;
      else:
         output = stdout;
      _outLines = string.split(output, "\n");
      for _line in range(len(_outLines)):
         _current = re.split(" +", _outLines[_line]);                
         if(len(_current) > 2):
            _posDev = _current[2].indexOf("dev=");
            if(_posDev != -1):
               _opticalDrive.append(self.subString(_current[6], 1, len(_current[6])) + " " + self.subString(_current[7], 0, len(_current[7])));

      opticalDrives.append(_opticalDrive);
      return opticalDrives;

def main():
   # check if script is already running 
   #scriptStarter('force')    
   kernelI = KernelInformer();
   kernelI.wirteInformer();
 
 # remove pid-file before exit.
 # removePIDfile()

if __name__=="__main__":
   main();






