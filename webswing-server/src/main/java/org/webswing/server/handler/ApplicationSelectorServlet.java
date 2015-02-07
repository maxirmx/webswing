package org.webswing.server.handler;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.webswing.model.server.SwingApplicationDescriptor;
import org.webswing.server.ConfigurationManager;
import org.webswing.server.stats.SessionRecorder;

public class ApplicationSelectorServlet extends HttpServlet {

	private static final long serialVersionUID = -4359050705016810024L;
	public static final String SELECTED_APPLICATION = "selectedApplication";
	public static final String APPLICATION_CUSTOM_ARGS_PARAM = "args";
	public static final String APPLICATION_CUSTOM_ARGS = "applicationCustomArgs";

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		String appName = req.getPathInfo();
		if (appName != null && appName.length() > 0) {
			appName = appName.startsWith("/") ? appName.substring(1) : appName;
			SwingApplicationDescriptor app = ConfigurationManager.getInstance().getApplication(appName);
			if (app != null) {
				req.getSession().setAttribute(SELECTED_APPLICATION, appName);
				if (req.getParameter(APPLICATION_CUSTOM_ARGS_PARAM) != null) {
					req.getSession().setAttribute(APPLICATION_CUSTOM_ARGS, req.getParameter(APPLICATION_CUSTOM_ARGS_PARAM));
				}

				if (req.getParameter(SessionRecorder.RECORDING_FLAG) != null) {
					req.getSession().setAttribute(SessionRecorder.RECORDING_FLAG, req.getParameter(SessionRecorder.RECORDING_FLAG));
				}
				resp.sendRedirect("/");
			} else {
				resp.sendRedirect("/appNotfound.html?app=" + appName);
			}
		} else {
			resp.sendRedirect("/appNotfound.html?app=UNSPECIFIED");
		}
	}
}
