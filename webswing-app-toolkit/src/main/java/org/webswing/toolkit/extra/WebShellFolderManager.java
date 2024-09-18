package org.webswing.toolkit.extra;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.List;

import org.webswing.Constants;


import sun.awt.shell.ShellFolder;
import sun.awt.shell.ShellFolder.Invoker;

public class WebShellFolderManager {

	private boolean windows;
	private Object defaultManager;

	private File root;

	public WebShellFolderManager() {
		String path = System.getProperty(Constants.SWING_START_SYS_PROP_TRANSFER_DIR, System.getProperty("user.dir") + "/upload");
		root = new IsolatedRootFile(path);
		if(!root.getAbsoluteFile().exists()) {
			root.mkdirs();
		}
		System.setProperty("user.home", root.getAbsolutePath());

		windows = System.getProperty("os.name", "").startsWith("Windows");

		try {
			if (windows)
			{
				Class<?> managerClass = ClassLoader.getSystemClassLoader().loadClass("sun.awt.shell.Win32ShellFolderManager2");
				Constructor<?> c = managerClass.getDeclaredConstructor();
				c.setAccessible(true);
				defaultManager = c.newInstance();

			}
			else
			{
				Class<?> managerClass = ClassLoader.getSystemClassLoader().loadClass("sun.awt.shell.ShellFolderManager");
				Constructor<?> c = managerClass.getDeclaredConstructor();
				c.setAccessible(true);
				defaultManager = c.newInstance();
			}
		} catch (Exception e) {
			System.err.println("Error while instantiating default shell folder manager. " + e.getMessage());
			e.printStackTrace();
		}
	}

	public Object get(String paramString) {
		if (paramString.equals("fileChooserDefaultFolder")) {
			return root;
		}
		if (paramString.equals("roots")) {
			return new File[] { root };
		}
		if (paramString.equals("fileChooserComboBoxFolders")) {
			return new File[] { root };
		}
		if (paramString.equals("fileChooserShortcutPanelFolders")) {
			return new File[] { root };
		}
		if (paramString.startsWith("fileChooserIcon ") || paramString.startsWith("optionPaneIcon ") || paramString.startsWith("shell32Icon ")) {
			try {
				Method m = defaultManager.getClass().getDeclaredMethod("get", File.class);
				m.setAccessible(true);
				return (ShellFolder) m.invoke(defaultManager, paramString);
			} catch (Exception e) {
				System.err.println("Failed to invoke get(fileChooserIcon ...) method on default shell folder manager: " + e.getMessage());
				e.printStackTrace();
				return null;
			}
		}
		return null;
	}

	public ShellFolder createShellFolder(File paramFile) throws FileNotFoundException {	
		try {
			if (paramFile.getCanonicalPath().startsWith(root.getCanonicalPath())) {
					try {
						Method m = defaultManager.getClass().getDeclaredMethod("createShellFolder", File.class);
						m.setAccessible(true);
						return (ShellFolder) m.invoke(defaultManager, paramFile);
					} catch (Exception e) {
						System.err.println("Failed to invoke createShellFolder method on default shell folder manager: " + e.getMessage());
						e.printStackTrace();
						return null;
					}
			} else {
				return null;
			}
		} catch (IOException e) {
			System.err.println("Error while creating ShellFolder. " + e.getMessage());
			return null;
		}
	}

	protected Invoker createInvoker() {

		try {
				Method m = defaultManager.getClass().getDeclaredMethod("createInvoker");
				m.setAccessible(true);
				return (Invoker) m.invoke(defaultManager);
			} catch (Exception e) {
				System.err.println("Failed to invoke createInvoker method on default shell folder manager: " + e.getMessage());
				e.printStackTrace();
				return null;
			}
	}

	public boolean isComputerNode(File paramFile) {
			try {
				Method m = defaultManager.getClass().getDeclaredMethod("isComputerNode", File.class);
				m.setAccessible(true);
				return (Boolean) m.invoke(defaultManager, paramFile);
			} catch (Exception e) {
				System.err.println("Failed to invoke isComputerNode method on default shell folder manager: " + e.getMessage());
				e.printStackTrace();
				return false;
			}
	}

	public boolean isFileSystemRoot(File paramFile) {
		try {
			if (root.getCanonicalPath().equals(paramFile.getCanonicalPath())) {
				return true;
			} else {
				return false;
			}
		} catch (IOException e1) {
				try {
					Method m = defaultManager.getClass().getDeclaredMethod("isFileSystemRoot", File.class);
					m.setAccessible(true);
					return (Boolean) m.invoke(defaultManager, paramFile);
				} catch (Exception e) {
					System.err.println("Failed to invoke isFileSystemRoot method on default shell folder manager: " + e.getMessage());
					e.printStackTrace();
					return false;
				}
		}

	}

	@SuppressWarnings("rawtypes")
	public void sortFiles(List paramList) {
		if (!windows) {
			try {
				Method m = defaultManager.getClass().getDeclaredMethod("sortFiles", List.class);
				m.setAccessible(true);
				m.invoke(defaultManager, paramList);
			} catch (Exception e) {
				System.err.println("Failed to invoke sortFiles method on default shell folder manager: " + e.getMessage());
				e.printStackTrace();
			}
		}
	}
}
