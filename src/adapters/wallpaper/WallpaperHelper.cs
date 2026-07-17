using System;
using System.Runtime.InteropServices;
using System.IO;

namespace Murmur {
    [ComImport]
    [Guid("C2CF3110-460E-4fc1-B9D0-8A1C0C9CC4BD")]
    public class DesktopWallpaperClass {}

    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("B92B56A9-8B55-4E14-9A89-0199BBB6F93B")]
    public interface IDesktopWallpaper {
        void SetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorID, [MarshalAs(UnmanagedType.LPWStr)] string wallpaper);
        [return: MarshalAs(UnmanagedType.LPWStr)]
        string GetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorID);
        [return: MarshalAs(UnmanagedType.LPWStr)]
        string GetMonitorDevicePathAt(uint monitorIndex);
        uint GetMonitorDevicePathCount();
    }

    class Program {
        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);

        static void Main(string[] args) {
            if (args.Length == 0) {
                Console.WriteLine("Usage: WallpaperHelper.exe <action> <args>");
                return;
            }

            string action = args[0].ToLower();

            if (action == "count") {
                try {
                    var wp = (IDesktopWallpaper)new DesktopWallpaperClass();
                    Console.WriteLine(wp.GetMonitorDevicePathCount());
                } catch (Exception ex) {
                    Console.WriteLine("ERROR: COM failed. " + ex.Message);
                }
            } else if (action == "set") {
                if (args.Length < 3) {
                    Console.WriteLine("ERROR: Missing arguments for set");
                    return;
                }
                int index = int.Parse(args[1]);
                string path = args[2];

                // Try COM
                try {
                    var wp = (IDesktopWallpaper)new DesktopWallpaperClass();
                    string id = wp.GetMonitorDevicePathAt((uint)index);
                    wp.SetWallpaper(id, path);
                    Console.WriteLine("SUCCESS");
                } catch (Exception ex) {
                    Console.WriteLine("WARN: COM failed, falling back to SystemParametersInfo. " + ex.Message);
                    try {
                        SystemParametersInfo(0x0014, 0, path, 3);
                        Console.WriteLine("SUCCESS_FALLBACK");
                    } catch (Exception fallbackEx) {
                        Console.WriteLine("ERROR: Fallback failed. " + fallbackEx.Message);
                    }
                }
            } else if (action == "backup") {
                if (args.Length < 2) {
                    Console.WriteLine("ERROR: Missing backup file path");
                    return;
                }
                string backupFile = args[1];
                try {
                    var wp = (IDesktopWallpaper)new DesktopWallpaperClass();
                    uint count = wp.GetMonitorDevicePathCount();
                    var paths = new string[count];
                    for (uint i = 0; i < count; i++) {
                        string id = wp.GetMonitorDevicePathAt(i);
                        paths[i] = wp.GetWallpaper(id);
                    }
                    File.WriteAllText(backupFile, string.Join("|", paths));
                    Console.WriteLine("SUCCESS");
                } catch (Exception ex) {
                    Console.WriteLine("ERROR: " + ex.Message);
                }
            } else if (action == "restore") {
                if (args.Length < 2) {
                    Console.WriteLine("ERROR: Missing backup file path");
                    return;
                }
                string backupFile = args[1];
                if (!File.Exists(backupFile)) {
                    Console.WriteLine("ERROR: Backup file does not exist");
                    return;
                }
                try {
                    string content = File.ReadAllText(backupFile);
                    string[] paths = content.Split('|');
                    var wp = (IDesktopWallpaper)new DesktopWallpaperClass();
                    for (uint i = 0; i < (uint)paths.Length; i++) {
                        if (!string.IsNullOrEmpty(paths[i])) {
                            string id = wp.GetMonitorDevicePathAt(i);
                            wp.SetWallpaper(id, paths[i]);
                        }
                    }
                    Console.WriteLine("SUCCESS");
                } catch (Exception ex) {
                    Console.WriteLine("WARN: COM restore failed, restoring first wallpaper. " + ex.Message);
                    try {
                        string content = File.ReadAllText(backupFile);
                        string[] paths = content.Split('|');
                        if (paths.Length > 0 && !string.IsNullOrEmpty(paths[0])) {
                            SystemParametersInfo(0x0014, 0, paths[0], 3);
                            Console.WriteLine("SUCCESS_FALLBACK");
                        }
                    } catch (Exception fallbackEx) {
                        Console.WriteLine("ERROR: Fallback restore failed. " + fallbackEx.Message);
                    }
                }
            }
        }
    }
}
