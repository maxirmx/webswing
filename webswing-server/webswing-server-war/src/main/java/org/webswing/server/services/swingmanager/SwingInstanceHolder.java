package org.webswing.server.services.swingmanager;

import java.util.List;

import org.webswing.model.c2s.ConnectionHandshakeMsgIn;
import org.webswing.server.services.security.login.WebswingSecurityProvider;
import org.webswing.server.services.swinginstance.SwingInstance;
import org.webswing.server.services.websocket.WebSocketConnection;

public interface SwingInstanceHolder {
	SwingInstance findByInstanceId(ConnectionHandshakeMsgIn handshake, WebSocketConnection r);

	SwingInstance findInstanceBySessionId(String uuid);

	SwingInstance findInstanceByClientId(String clientId);

	List<SwingInstance> getAllInstances();

	List<SwingInstance> getAllClosedInstances();
	
	List<SwingInstanceManager> getApplications();
	
	WebswingSecurityProvider getSecurityProviderForApp(String path);

}
