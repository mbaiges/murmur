using System;
using System.Runtime.InteropServices;
using System.IO;
using System.Text;

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

        [DllImport("user32.dll")]
        public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);

        [DllImport("user32.dll")]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll")]
        public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);

        [DllImport("user32.dll")]
        public static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

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
            } else if (action == "inject") {
                if (args.Length < 2) {
                    Console.WriteLine("ERROR: Missing window title");
                    return;
                }
                string title = args[1];
                
                try {
                    // 1. Send 0x052C message to Progman to spawn WorkerW
                    IntPtr progman = FindWindow("Progman", null);
                    IntPtr result = IntPtr.Zero;
                    SendMessageTimeout(progman, 0x052C, IntPtr.Zero, IntPtr.Zero, 0, 1000, out result);

                    // 2. Find the WorkerW container window
                    IntPtr workerw = IntPtr.Zero;
                    EnumWindows(new EnumWindowsProc((tophwnd, lparam) => {
                        IntPtr shellDll = FindWindowEx(tophwnd, IntPtr.Zero, "SHELLDLL_DefView", null);
                        if (shellDll != IntPtr.Zero) {
                            workerw = FindWindowEx(IntPtr.Zero, tophwnd, "WorkerW", null);
                        }
                        return true;
                    }), IntPtr.Zero);

                    if (workerw == IntPtr.Zero) {
                        workerw = FindWindow("WorkerW", null);
                    }

                    if (workerw == IntPtr.Zero) {
                        Console.WriteLine("ERROR: WorkerW container not found");
                        return;
                    }

                    // 3. Find the target borderless window
                    IntPtr childHwnd = FindWindow(null, title);
                    if (childHwnd == IntPtr.Zero) {
                        Console.WriteLine("ERROR: Target window not found: " + title);
                        return;
                    }

                    // 4. Set target window parent as WorkerW
                    SetParent(childHwnd, workerw);
                    Console.WriteLine("SUCCESS");
                } catch (Exception ex) {
                    Console.WriteLine("ERROR: Injection failed. " + ex.Message);
                }
            }
        }
    }
}
