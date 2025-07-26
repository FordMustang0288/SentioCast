'use strict';

import { useRef, useState } from 'react';
import { getShadowNodeWrapperFromRef } from '../fabricUtils';
import { makeMutable } from "../mutables.js";
import { isFabric, isIOS, isMacOS, shouldBeUseWeb } from "../PlatformChecker.js";
import { findNodeHandle } from '../platformFunctions/findNodeHandle';
import { shareableMappingCache } from "../shareableMappingCache.js";
import { makeShareableCloneRecursive } from "../shareables.js";
const SHOULD_BE_USE_WEB = shouldBeUseWeb();
function getComponentOrScrollable(component) {
  if (component.getNativeScrollRef) {
    return component.getNativeScrollRef();
  }
  if (component.getScrollableNode) {
    return component.getScrollableNode();
  }
  return component;
}
function useAnimatedRefBase(getWrapper) {
  const observers = useRef(new Map()).current;
  const tagOrWrapperRef = useRef(-1);
  const ref = useRef(null);
  if (!ref.current) {
    const fun = component => {
      if (component) {
        tagOrWrapperRef.current = getWrapper(component);

        // We have to unwrap the tag from the shadow node wrapper.
        fun.getTag = () => findNodeHandle(getComponentOrScrollable(component));
        fun.current = component;
        if (observers.size) {
          const currentTag = fun?.getTag?.() ?? null;
          observers.forEach((cleanup, observer) => {
            // Perform the cleanup before calling the observer again.
            // This ensures that all events that were set up in the observer
            // are cleaned up before the observer sets up new events during
            // the next call.
            cleanup?.();
            observers.set(observer, observer(currentTag));
          });
        }
      }
      return tagOrWrapperRef.current;
    };
    fun.observe = observer => {
      // Call observer immediately to get the initial value
      const cleanup = observer(fun?.getTag?.() ?? null);
      observers.set(observer, cleanup);
      return () => {
        observers.get(observer)?.();
        observers.delete(observer);
      };
    };
    fun.current = null;
    ref.current = fun;
  }
  return ref.current;
}
const IS_APPLE = isIOS() || isMacOS();
function useAnimatedRefNative() {
  const [viewName] = useState(() =>
  // viewName is required only on iOS/MacOS with Paper
  !isFabric() && IS_APPLE ? makeMutable(null) : null);
  const [tagOrWrapper] = useState(() => makeMutable(null));
  const ref = useAnimatedRefBase(component => {
    const getTagOrWrapper = isFabric() ? getShadowNodeWrapperFromRef : findNodeHandle;
    tagOrWrapper.value = getTagOrWrapper(getComponentOrScrollable(component));
    if (viewName) {
      viewName.value = component?.viewConfig?.uiViewClassName || 'RCTView';
    }
    return tagOrWrapper.value;
  });
  if (!shareableMappingCache.get(ref)) {
    const animatedRefShareableHandle = makeShareableCloneRecursive({
      __init: () => {
        'worklet';

        const f = () => tagOrWrapper.value;
        if (viewName) {
          f.viewName = viewName;
        }
        return f;
      }
    });
    shareableMappingCache.set(ref, animatedRefShareableHandle);
  }
  return ref;
}
function useAnimatedRefWeb() {
  return useAnimatedRefBase(component => getComponentOrScrollable(component));
}

/**
 * Lets you get a reference of a view that you can use inside a worklet.
 *
 * @returns An object with a `.current` property which contains an instance of a
 *   component.
 * @see https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedRef
 */
export const useAnimatedRef = SHOULD_BE_USE_WEB ? useAnimatedRefWeb : useAnimatedRefNative;
//# sourceMappingURL=useAnimatedRef.js.map