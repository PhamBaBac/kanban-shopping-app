const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const imageStorageConfig = {
	provider: 'cloudinary',
	cloudName,
	uploadPreset,
	folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'kanban',
};

export const getImageUploadEndpoint = () => {
	if (!imageStorageConfig.cloudName || !imageStorageConfig.uploadPreset) {
		throw new Error(
			'Thiếu cấu hình Cloudinary. Hãy thêm NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME và NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET vào file .env.local'
		);
	}

	return `https://api.cloudinary.com/v1_1/${imageStorageConfig.cloudName}/image/upload`;
};
