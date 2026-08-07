using System;
using System.Runtime.InteropServices;
using System.IO;
using System.Text;
using Microsoft.Win32;

namespace Murmur {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

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
        void GetMonitorRECT([MarshalAs(UnmanagedType.LPWStr)] string monitorID, out RECT displayRect);
        void SetBackgroundColor(uint color);
        void GetBackgroundColor(out uint color);
        void SetPosition(int position); // 4 = Fill, 5 = Span
        void GetPosition(out int position);
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

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        private static extern int GetSystemMetrics(int nIndex);

        [DllImport("user32.dll")]
        private static extern IntPtr MonitorFromRect(ref RECT lprc, uint dwFlags);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO lpmi);

        private const uint MONITOR_DEFAULTTONEAREST = 2;

        [StructLayout(LayoutKind.Sequential)]
        private struct MONITORINFO {
            public int cbSize;
            public RECT rcMonitor;
            public RECT rcWork;
            public uint dwFlags;
        }

        private const int GWL_STYLE = -16;
        private const int GWL_EXSTYLE = -20;

        private const int WS_CHILD = 0x40000000;
        private const int WS_POPUP = unchecked((int)0x80000000);
        private const int WS_CAPTION = 0x00C00000;
        private const int WS_THICKFRAME = 0x00040000;
        private const int WS_MINIMIZEBOX = 0x00020000;
        private const int WS_MAXIMIZEBOX = 0x00010000;
        private const int WS_SYSMENU = 0x00080000;
        private const int WS_VISIBLE = 0x10000000;

        private const int WS_EX_TRANSPARENT = 0x20;
        private const int WS_EX_NOACTIVATE = 0x08000000;
        private const int WS_EX_TOOLWINDOW = 0x00000080;
        private const int WS_EX_APPWINDOW = 0x00040000;

        private const int SW_HIDE = 0;
        private const int SW_SHOWNOACTIVATE = 4;

        private const uint SWP_NOSIZE = 0x0001;
        private const uint SWP_NOMOVE = 0x0002;
        private const uint SWP_NOZORDER = 0x0004;
        private const uint SWP_NOACTIVATE = 0x0010;
        private const uint SWP_FRAMECHANGED = 0x0020;

        /// <summary>
        /// Electron/Chromium must not use WS_EX_LAYERED here — it freezes repaints and CSS animation.
        /// Strip WS_EX_APPWINDOW so reparented HWNDs do not appear on the taskbar as ghost entries.
        /// </summary>
        private static void ApplyChildDesktopStyles(IntPtr childHwnd) {
            if (childHwnd == IntPtr.Zero) {
                return;
            }
            int exStyle = GetWindowLong(childHwnd, GWL_EXSTYLE);
            exStyle &= ~WS_EX_APPWINDOW;
            exStyle &= ~0x80000; // WS_EX_LAYERED
            exStyle |= WS_EX_TRANSPARENT | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW;
            SetWindowLong(childHwnd, GWL_EXSTYLE, exStyle);
            SetWindowPos(
                childHwnd,
                IntPtr.Zero,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED
            );
        }

        private static bool IsWorkerWWithoutShellView(IntPtr hwnd) {
            StringBuilder className = new StringBuilder(256);
            GetClassName(hwnd, className, className.Capacity);
            if (className.ToString() != "WorkerW") {
                return false;
            }
            return FindWindowEx(hwnd, IntPtr.Zero, "SHELLDLL_DefView", null) == IntPtr.Zero;
        }

        /// <summary>
        /// Locates the empty WorkerW layer behind desktop icons. Optionally sends Progman 0x052C once to create it.
        /// </summary>
        private static bool TryResolveDesktopWorkerW(bool spawnLayer, out IntPtr shellWorkerW, out IntPtr desktopWorkerW) {
            shellWorkerW = IntPtr.Zero;
            desktopWorkerW = IntPtr.Zero;

            if (spawnLayer) {
                IntPtr progman = FindWindow("Progman", null);
                if (progman == IntPtr.Zero) {
                    return false;
                }
                IntPtr result = IntPtr.Zero;
                SendMessageTimeout(progman, 0x052C, IntPtr.Zero, IntPtr.Zero, 0, 1000, out result);
            }

            for (int attempt = 0; attempt < 10; attempt++) {
                IntPtr foundShell = IntPtr.Zero;
                IntPtr foundDesktop = IntPtr.Zero;

                EnumWindows(new EnumWindowsProc((tophwnd, lparam) => {
                    StringBuilder className = new StringBuilder(256);
                    GetClassName(tophwnd, className, className.Capacity);
                    if (className.ToString() == "WorkerW") {
                        IntPtr shellDll = FindWindowEx(tophwnd, IntPtr.Zero, "SHELLDLL_DefView", null);
                        if (shellDll != IntPtr.Zero) {
                            foundShell = tophwnd;
                        } else {
                            foundDesktop = tophwnd;
                        }
                    }
                    return true;
                }), IntPtr.Zero);

                shellWorkerW = foundShell;
                desktopWorkerW = foundDesktop;

                if (spawnLayer) {
                    if (shellWorkerW != IntPtr.Zero && desktopWorkerW != IntPtr.Zero) {
                        return true;
                    }
                } else if (desktopWorkerW != IntPtr.Zero) {
                    return true;
                }
                if (!spawnLayer) {
                    break;
                }
                System.Threading.Thread.Sleep(50);
            }

            return desktopWorkerW != IntPtr.Zero;
        }

        /// <summary>
        /// Hides stale empty WorkerW hosts Explorer creates when 0x052C runs more than once.
        /// Only call when we just spawned a new desktop layer (first inject).
        /// </summary>
        private static void HideOrphanDesktopWorkerW(IntPtr keepWorkerW) {
            EnumWindows(new EnumWindowsProc((tophwnd, lparam) => {
                if (tophwnd == keepWorkerW) {
                    return true;
                }
                if (IsWorkerWWithoutShellView(tophwnd)) {
                    ShowWindow(tophwnd, SW_HIDE);
                }
                return true;
            }), IntPtr.Zero);
        }

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
                    // Update Windows User Registry to enforce 'Fill' style (WallpaperStyle = 10, TileWallpaper = 0)
                    using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"Control Panel\Desktop", true)) {
                        if (key != null) {
                            key.SetValue("WallpaperStyle", "10");
                            key.SetValue("TileWallpaper", "0");
                        }
                    }

                    var wp = (IDesktopWallpaper)new DesktopWallpaperClass();
                    wp.SetPosition(4);

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
                bool reuseDesktopLayer = args.Length >= 3 && args[2].Equals("reuse", StringComparison.OrdinalIgnoreCase);
                
                try {
                    IntPtr shellWorkerW;
                    IntPtr workerwToUse;
                    bool spawnLayer = !reuseDesktopLayer;
                    if (!TryResolveDesktopWorkerW(spawnLayer, out shellWorkerW, out workerwToUse)) {
                        if (!spawnLayer && TryResolveDesktopWorkerW(true, out shellWorkerW, out workerwToUse)) {
                            // Reuse requested but layer missing — create once.
                        } else {
                            Console.WriteLine("ERROR: Desktop WorkerW layer not found");
                            return;
                        }
                    }

                    IntPtr progmanFallback = FindWindow("Progman", null);
                    IntPtr targetParent = workerwToUse != IntPtr.Zero ? workerwToUse : (shellWorkerW != IntPtr.Zero ? shellWorkerW : progmanFallback);

                    if (workerwToUse != IntPtr.Zero) {
                        if (spawnLayer) {
                            HideOrphanDesktopWorkerW(workerwToUse);
                        }
                        ShowWindow(workerwToUse, SW_SHOWNOACTIVATE);
                    }

                    // Find the target borderless window (either by raw HWND number or title fallback)
                    IntPtr childHwnd = IntPtr.Zero;
                    long parsedHwnd;
                    if (long.TryParse(title, out parsedHwnd)) {
                        childHwnd = new IntPtr(parsedHwnd);
                    } else {
                        childHwnd = FindWindow(null, title);
                    }

                    if (childHwnd == IntPtr.Zero) {
                        Console.WriteLine("ERROR: Target window not found: " + title);
                        return;
                    }

                    // 5. Query child window screen bounds BEFORE reparenting to identify its target monitor area
                    RECT childRect;
                    GetWindowRect(childHwnd, out childRect);
                    int childWidth = childRect.Right - childRect.Left;
                    int childHeight = childRect.Bottom - childRect.Top;

                    // 6. Query parent window screen bounds to calculate relative offset
                    RECT parentRect;
                    GetWindowRect(targetParent, out parentRect);

                    int relativeX = childRect.Left - parentRect.Left;
                    int relativeY = childRect.Top - parentRect.Top;

                    IntPtr hMonitor = MonitorFromRect(ref childRect, MONITOR_DEFAULTTONEAREST);
                    MONITORINFO monitorInfo = new MONITORINFO();
                    monitorInfo.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
                    if (GetMonitorInfo(hMonitor, ref monitorInfo)) {
                        childWidth = monitorInfo.rcMonitor.Right - monitorInfo.rcMonitor.Left;
                        childHeight = monitorInfo.rcMonitor.Bottom - monitorInfo.rcMonitor.Top;
                        relativeX = monitorInfo.rcMonitor.Left - parentRect.Left;
                        relativeY = monitorInfo.rcMonitor.Top - parentRect.Top;
                    }

                    // 7. Transition target window style from POPUP to CHILD to become a nested control window
                    int style = GetWindowLong(childHwnd, GWL_STYLE);
                    style &= ~(WS_POPUP | WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU);
                    style |= WS_CHILD | WS_VISIBLE;
                    SetWindowLong(childHwnd, GWL_STYLE, style);

                    // 8. Parent our window inside the target container
                    SetParent(childHwnd, targetParent);

                    ApplyChildDesktopStyles(childHwnd);

                    // 10. Position and resize the child window precisely at its parent-relative monitor slot
                    // HWND_TOP = 0
                    // SWP_NOACTIVATE = 0x0010, SWP_SHOWWINDOW = 0x0040, SWP_FRAMECHANGED = 0x0020
                    SetWindowPos(childHwnd, IntPtr.Zero, relativeX, relativeY, childWidth, childHeight, SWP_NOACTIVATE | 0x0040 | SWP_FRAMECHANGED);

                    ApplyChildDesktopStyles(childHwnd);

                    Console.WriteLine("SUCCESS");
                } catch (Exception ex) {
                    Console.WriteLine("ERROR: Injection failed. " + ex.Message);
                }
            } else if (action == "stylechild") {
                if (args.Length < 2) {
                    Console.WriteLine("ERROR: Missing window handle");
                    return;
                }
                try {
                    long parsedHwnd;
                    if (!long.TryParse(args[1], out parsedHwnd)) {
                        Console.WriteLine("ERROR: Invalid HWND");
                        return;
                    }
                    ApplyChildDesktopStyles(new IntPtr(parsedHwnd));
                    Console.WriteLine("SUCCESS");
                } catch (Exception ex) {
                    Console.WriteLine("ERROR: stylechild failed. " + ex.Message);
                }
            }
        }
    }
}
