/**
 * <p>Title: FundCount, LLC</p>
 * <p>Description: FundCount project</p>
 * <p>Copyright: Copyright (c) 2001-2015 FundCount, LLC</p>
 * <p>Company: FundCount, LLC</p>
 */
package org.webswing.directdraw.model;

import com.google.protobuf.*;
import org.webswing.directdraw.*;

/**
 * <u>Holder for mutable values</u> that should be serialized immediately
 * as they could be modified from the outer code.
 */
public abstract class MutableDrawConstantHolder<T, M extends Message> extends DrawConstant<T> {
    
    protected M message;

    public MutableDrawConstantHolder(DirectDraw context, T value) {
        super(context);
        this.message = buildMessage(value);
    }
    
    protected abstract M buildMessage(T value);

    @Override
    public final M toMessage() {
        return message;
    }

    @Override
    public final int hashCode() {
        return message.hashCode();
    }

    @Override
    public final boolean equals(Object o) {
        return o == this ||
            o instanceof MutableDrawConstantHolder && message.equals(((MutableDrawConstantHolder) o).message);
    }
}
