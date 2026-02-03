'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

/**
 * Server Actions for Image CRUD operations
 * All actions require authentication via requireAuth()
 */

export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

/**
 * Create a new image
 */
export async function createImage(formData: FormData): Promise<ActionResult> {
  try {
    await requireAuth();

    const url = formData.get('url') as string;
    const photographerName = formData.get('photographer_name') as string;
    const photographerUrl = formData.get('photographer_url') as string || null;
    const source = formData.get('source') as string || 'Unsplash';

    // Validation
    if (!url || url.trim().length === 0) {
      return { success: false, error: 'Image URL is required' };
    }

    if (!photographerName || photographerName.trim().length === 0) {
      return { success: false, error: 'Photographer name is required' };
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return { success: false, error: 'Invalid URL format' };
    }

    // Check for duplicate URL
    const existing = await prisma.image.findFirst({
      where: {
        url: url.trim(),
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'An image with this URL already exists',
      };
    }

    // Create image
    await prisma.image.create({
      data: {
        url: url.trim(),
        photographerName: photographerName.trim(),
        photographerUrl: photographerUrl?.trim() || null,
        source: source.trim(),
        active: true,
      },
    });

    revalidatePath('/admin/images');
    revalidatePath('/admin/dashboard');

    return { success: true, message: 'Image added successfully' };
  } catch (error) {
    console.error('Error creating image:', error);
    return { success: false, error: 'Failed to add image' };
  }
}

/**
 * Update an existing image
 */
export async function updateImage(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAuth();

    const url = formData.get('url') as string;
    const photographerName = formData.get('photographer_name') as string;
    const photographerUrl = formData.get('photographer_url') as string || null;
    const source = formData.get('source') as string || 'Unsplash';

    // Validation
    if (!url || url.trim().length === 0) {
      return { success: false, error: 'Image URL is required' };
    }

    if (!photographerName || photographerName.trim().length === 0) {
      return { success: false, error: 'Photographer name is required' };
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return { success: false, error: 'Invalid URL format' };
    }

    // Check if image exists
    const existing = await prisma.image.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: 'Image not found' };
    }

    // Check for duplicate URL (excluding current image)
    const duplicate = await prisma.image.findFirst({
      where: {
        id: { not: id },
        url: url.trim(),
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: 'An image with this URL already exists',
      };
    }

    // Update image
    await prisma.image.update({
      where: { id },
      data: {
        url: url.trim(),
        photographerName: photographerName.trim(),
        photographerUrl: photographerUrl?.trim() || null,
        source: source.trim(),
      },
    });

    revalidatePath('/admin/images');
    revalidatePath('/admin/dashboard');

    return { success: true, message: 'Image updated successfully' };
  } catch (error) {
    console.error('Error updating image:', error);
    return { success: false, error: 'Failed to update image' };
  }
}

/**
 * Delete an image
 * Shows cascade warning if image is used in pairings
 */
export async function deleteImage(id: string): Promise<ActionResult> {
  try {
    await requireAuth();

    // Check if image exists and count pairings
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pairings: true },
        },
      },
    });

    if (!image) {
      return { success: false, error: 'Image not found' };
    }

    // Cascade warning if used in pairings
    if (image._count.pairings > 0) {
      return {
        success: false,
        error: `Cannot delete: This image is used in ${image._count.pairings} pairing(s). Delete the pairings first.`,
      };
    }

    // Delete image
    await prisma.image.delete({
      where: { id },
    });

    revalidatePath('/admin/images');
    revalidatePath('/admin/dashboard');

    return { success: true, message: 'Image deleted successfully' };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: 'Failed to delete image' };
  }
}

/**
 * Toggle image active status
 */
export async function toggleImageActive(id: string): Promise<ActionResult> {
  try {
    await requireAuth();

    const image = await prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      return { success: false, error: 'Image not found' };
    }

    await prisma.image.update({
      where: { id },
      data: {
        active: !image.active,
      },
    });

    revalidatePath('/admin/images');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      message: image.active ? 'Image deactivated' : 'Image activated',
    };
  } catch (error) {
    console.error('Error toggling image active:', error);
    return { success: false, error: 'Failed to toggle image status' };
  }
}
