import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';
import type { DevicePlatform, VpnClient } from '../types/domain';
import { authStore } from './auth-store';

export function usePlansQuery() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => apiClient.getPlans(),
    staleTime: 120_000,
    placeholderData: keepPreviousData
  });
}

export function useYookassaCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { planId: string; receiptEmail?: string }) =>
      apiClient.createYookassaCheckout(input.planId, input.receiptEmail),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });
}

export function useCurrentSubscriptionQuery() {
  return useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: () => apiClient.getCurrentSubscription(),
    enabled: Boolean(authStore.getToken()),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });
}

export function useVpnAccessQuery(deviceFingerprint: string) {
  return useQuery({
    queryKey: ['vpn-access', deviceFingerprint],
    queryFn: () => apiClient.getVpnAccess(deviceFingerprint),
    enabled: Boolean(authStore.getToken()) && Boolean(deviceFingerprint),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });
}

export function useVpnDevicesQuery() {
  return useQuery({
    queryKey: ['vpn', 'devices'],
    queryFn: () => apiClient.getVpnDevices(),
    enabled: Boolean(authStore.getToken()),
    staleTime: 30_000,
    placeholderData: keepPreviousData
  });
}

export function useConnectPayloadMutation() {
  return useMutation({
    mutationFn: (input: { platform: DevicePlatform; client: VpnClient; deviceFingerprint: string }) =>
      apiClient.getConnectPayload(input)
  });
}

export function useVpnProvisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { deviceFingerprint: string; platform: DevicePlatform; label?: string | null }) =>
      apiClient.provisionVpn(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'vpn-access'
      });
      await queryClient.invalidateQueries({ queryKey: ['vpn', 'devices'] });
    }
  });
}

export function useVpnRevokeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input?: { deviceFingerprint?: string }) => apiClient.revokeVpn(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'vpn-access'
      });
      await queryClient.invalidateQueries({ queryKey: ['vpn', 'devices'] });
    }
  });
}

export function useMeProfileQuery() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.getMe(),
    enabled: Boolean(authStore.getToken()),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });
}

export function useReferralsQuery() {
  return useQuery({
    queryKey: ['me', 'referrals'],
    queryFn: () => apiClient.getReferrals(),
    enabled: Boolean(authStore.getToken()),
    staleTime: 60_000
  });
}

export function useSupportQuery() {
  return useQuery({
    queryKey: ['me', 'support'],
    queryFn: () => apiClient.getSupportRequests(),
    enabled: Boolean(authStore.getToken()),
    staleTime: 60_000
  });
}
