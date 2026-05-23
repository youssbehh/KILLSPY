import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as friendsApi from '../api/friends';

const KEY = ['friends'];

export const useFriends = (enabled = true) =>
  useQuery({ queryKey: KEY, queryFn: friendsApi.getFriends, enabled });

export const useAddFriend = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => friendsApi.addFriend(username),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useBlockedFriends = (enabled = true) =>
  useQuery({ queryKey: ['friends', 'blocked'], queryFn: friendsApi.getBlockedFriends, enabled });
