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

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        private const int GWL_STYLE = -16;
        private const int GWL_EXSTYLE = -20;

        private const int WS_CHILD = 0x40000000;
        private const int WS_POPUP = unchecked((int)0x80000000);
        private const int WS_CAPTION = 0x00C00000;
        private const int WS_THICKFRAME = 0x00040000;
        private const int WS_MINIMIZEBOX = 0x00020000;
        private const int WS_MAXIMIZEBOX = 0x00010000;
        private const int WS_SYSMENU = 0x00080000;

        private const int WS_EX_TRANSPARENT = 0x20;
        private const int WS_EX_NOACTIVATE = 0x08000000;
        private const int WS_EX_LAYERED = 0x80000;

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

                    // 2. Scan and classify all WorkerW windows with a retry loop (wait up to 500ms total for Explorer thread split)
                    IntPtr shellWorkerW = IntPtr.Zero;
                    IntPtr workerwToUse = IntPtr.Zero;

                    for (int attempt = 0; attempt < 10; attempt++) {
                        shellWorkerW = IntPtr.Zero;
                        workerwToUse = IntPtr.Zero;

                        EnumWindows(new EnumWindowsProc((tophwnd, lparam) => {
                            StringBuilder className = new StringBuilder(256);
                            GetClassName(tophwnd, className, className.Capacity);
                            if (className.ToString() == "WorkerW") {
                                IntPtr shellDll = FindWindowEx(tophwnd, IntPtr.Zero, "SHELLDLL_DefView", null);
                                if (shellDll != IntPtr.Zero) {
                                    shellWorkerW = tophwnd;
                                } else {
                                    workerwToUse = tophwnd;
                                }
                            }
                            return true;
                        }), IntPtr.Zero);

                        if (shellWorkerW != IntPtr.Zero && workerwToUse != IntPtr.Zero) {
                            break; // Successfully found both sibling WorkerW windows
                        }
                        System.Threading.Thread.Sleep(50);
                    }

                    // If we couldn't identify the sibling WorkerW, default to shellWorkerW or Progman
                    IntPtr targetParent = workerwToUse != IntPtr.Zero ? workerwToUse : (shellWorkerW != IntPtr.Zero ? shellWorkerW : progman);

                    // 3. Ensure the sibling WorkerW container is visible (SW_SHOW = 5)
                    if (workerwToUse != IntPtr.Zero) {
                        ShowWindow(workerwToUse, 5);
                    }

                    // 4. Find the target borderless window
                    IntPtr childHwnd = FindWindow(null, title);
                    if (childHwnd == IntPtr.Zero) {
                        Console.WriteLine("ERROR: Target window not found: " + title);
                        return;
                    }

                    // 5. Transition target window style from POPUP to CHILD to become a nested control window
                    int style = GetWindowLong(childHwnd, GWL_STYLE);
                    style &= ~(WS_POPUP | WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU);
                    style |= WS_CHILD;
                    SetWindowLong(childHwnd, GWL_STYLE, style);

                    // 6. Parent our window inside the target container
                    SetParent(childHwnd, targetParent);

                    // 7. Apply extended styles (layered, non-activatable, transparent click-through)
                    int exStyle = GetWindowLong(childHwnd, GWL_EXSTYLE);
                    SetWindowLong(childHwnd, GWL_EXSTYLE, exStyle | WS_EX_TRANSPARENT | WS_EX_LAYERED | WS_EX_NOACTIVATE);

                    // 8. Force window to the bottom Z-order (HWND_BOTTOM = 1)
                    SetWindowPos(childHwnd, (IntPtr)1, 0, 0, 0, 0, 0x0002 | 0x0001 | 0x0010 | 0x0040);

                    Console.WriteLine("SUCCESS");
                } catch (Exception ex) {
                    Console.WriteLine("ERROR: Injection failed. " + ex.Message);
                }
            }
        }
    }
}
