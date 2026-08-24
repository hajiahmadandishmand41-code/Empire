/**
 * Seller Service — Business Logic Layer
 *
 * Manages seller store settings and public profile/list queries.
 */

import type { BaseListFilter } from '../repositories/base.repository';
import type { ISellerRepository, SellerPublicProfile, PublicSellerListItem, UpdateSellerStoreInput } from '../repositories/seller.repository';
import type { PaginatedResult } from '../repositories/base.repository';
import { NotFoundError } from '../infrastructure/errors';

export class SellerService {
  constructor(private readonly sellers: ISellerRepository) {}

  async listPublic(filter: BaseListFilter = {}): Promise<PaginatedResult<PublicSellerListItem>> {
    return this.sellers.findPublicMany(filter);
  }

  async getPublicProfile(sellerId: string): Promise<SellerPublicProfile> {
    const profile = await this.sellers.findPublicProfile(sellerId);
    if (!profile) throw new NotFoundError('Seller', sellerId);
    return profile;
  }

  async updateStoreSettings(sellerId: string, input: UpdateSellerStoreInput): Promise<void> {
    await this.sellers.updateStoreSettings(sellerId, input);
  }

  async getStoreSettings(sellerId: string): Promise<UpdateSellerStoreInput> {
    const settings = await this.sellers.getStoreSettings(sellerId);
    if (!settings) throw new NotFoundError('Seller', sellerId);
    return settings;
  }
}
