package org.webswing.server.services.rest;

import org.webswing.server.base.UrlHandler;
import org.webswing.server.services.swingmanager.SwingInstanceHolder;

public interface RestHandlerService {

	AbstractRestUrlHandler createConfigRestHandler(UrlHandler parent, SwingInstanceHolder instanceHolder);

	AbstractRestUrlHandler createSessionRestHandler(UrlHandler parent, SwingInstanceHolder instanceHolder);

	AbstractRestUrlHandler createServerRestHandler(UrlHandler parent);

	AbstractRestUrlHandler createSwingRestHandler(UrlHandler parent, SwingInstanceHolder instanceHolder);

	AbstractRestUrlHandler createOtpRestHandler(UrlHandler parent, SwingInstanceHolder instanceHolder);

	AbstractRestUrlHandler createAdminRestHandler(UrlHandler parent, SwingInstanceHolder instanceHolder);

}
