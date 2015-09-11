package org.webswing.toolkit.util;

import org.webswing.ext.services.*;

public class Services {

	private static ImageService imageService;
	private static PdfService pdfService;
	private static ServerConnectionService serverService;
	private static SwingClassLoaderFactoryService classloaderService;
	private static DirectDrawService directDrawService;
	private static JsLinkService jsLinkService;

	public static void initialize(ImageService imageServiceImpl, PdfService pdfServiceImpl, ServerConnectionService serverServiceImpl, SwingClassLoaderFactoryService classloaderServiceImpl, DirectDrawService directDrawServiceImpl, JsLinkService jsLinkServiceImpl) {
		imageService = imageServiceImpl;
		pdfService = pdfServiceImpl;
		serverService = serverServiceImpl;
		classloaderService = classloaderServiceImpl;
		directDrawService = directDrawServiceImpl;
		jsLinkService = jsLinkServiceImpl;
	}

	public static ImageService getImageService() {
		if (imageService == null) {
			Logger.fatal("ImageService has not been initialize. Exiting...");
			Util.getWebToolkit().exitSwing(1);
		}
		return imageService;
	}

	public static PdfService getPdfService() {
		if (pdfService == null) {
			Logger.fatal("PdfService has not been initialize. Exiting...");
			Util.getWebToolkit().exitSwing(1);
		}
		return pdfService;
	}

	public static ServerConnectionService getConnectionService() {
		if (serverService == null) {
			Logger.fatal("Connection service has not been initialize. Exiting...");
			Util.getWebToolkit().exitSwing(1);
		}
		return serverService;
	}

	public static SwingClassLoaderFactoryService getClassLoaderService() {
		if (classloaderService == null) {
			Logger.fatal("Classloader service has not been initialize. Exiting...");
			Util.getWebToolkit().exitSwing(1);
		}
		return classloaderService;
	}

	public static DirectDrawService getDirectDrawService() {
		if (directDrawService == null) {
			Logger.fatal("DirectDraw service has not been initialize. Exiting...");
			Util.getWebToolkit().exitSwing(1);
		}
		return directDrawService;
	}

	public static JsLinkService getJsLinkService() {
		if (jsLinkService == null) {
			Logger.fatal("JsLinkService service has not been initialize. Exiting...");
			Util.getWebToolkit().exitSwing(1);
		}
		return jsLinkService;
	}

}
