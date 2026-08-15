/**
 * Seller Service — Business Logic Layer
 *
 * Manages seller store settings and public profile queries.
 */

import type { ISellerRepository, SellerPublicProfile, UpdateSellerStoreInput } from '../repositories/seller.repository';
import { NotFoundError } from '../infrastructure/errors';

export class SellerService {
  constructor(private readonly sellers: ISellerRepository) {}

  async getPublicProfile(sellerId: string): Promise<SellerPublicProfile> {
    const profile = await this.sellers.findPublicProfile(sellerId);
    if (!profile) throw new NotFoundError('Seller', sellerId);
    return profile;
  }

  async updateStoreSettings(
    sellerId: string,
    input: UpdateSellerStoreInput,
  ): Promise<void> {
    await this.sellers.updateStoreSettings(sellerId, input);
  }

  async getStoreSettings(sellerId: string): Promise<UpdateSellerStoreInput> {
    const settings = await this.sellers.getStoreSettings(sellerId);
    if (!settings) throw new NotFoundError('Seller', sellerId);
    return settings;
  }
}
