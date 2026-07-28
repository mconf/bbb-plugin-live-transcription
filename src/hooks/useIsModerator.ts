import { PluginApi } from 'bigbluebutton-html-plugin-sdk';

export const useIsModerator = (pluginApi: PluginApi) => {
  const currentUser = pluginApi.useCurrentUser?.();
  const {
    data: currentUserData,
    loading: currentUserLoading,
  } = currentUser || {};

  return Boolean(!currentUserLoading && currentUserData && currentUserData.role === 'MODERATOR');
};
