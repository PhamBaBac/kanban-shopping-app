/** @format */

import handleAPI from '@/apis/handleApi';
import { AddNewAddress } from '@/components';
import { AddressModel } from '@/models/Products';
import {
	Button,
	Card,
	Divider,
	List,
	Modal,
	Space,
	Spin,
	Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { BiEdit } from 'react-icons/bi';
import { IoCheckmarkCircle, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { TbTrash } from 'react-icons/tb';

interface Props {
	onSelectAddress: (val: AddressModel) => void;
}

const ShipingAddress = (props: Props) => {
	const { onSelectAddress } = props;

	const [addressSelected, setAddressSelected] = useState<AddressModel>();
	const [address, setAddress] = useState<AddressModel[]>([]);
	const [isloading, setIsloading] = useState(false);
	const [isEditAddress, setIsEditAddress] = useState<AddressModel>();

	useEffect(() => {
		getAddress();
	}, []);

	useEffect(() => {
		if (address && address.length > 0) {
			const item = address.find((element) => element.isDefault);
			item && setAddressSelected(item);
		}
	}, [address]);

	const getAddress = async () => {
		const api = `/addresses/all`;
		setIsloading(true);
		try {
			const res: any = await handleAPI(api, {}, 'get');
			setAddress(res.result);
		} catch (error) {
			console.log(error);
		} finally {
			setIsloading(false);
		}
	};

	const handleRemoveAddress = async (item: AddressModel) => {
		const api = `/carts/remove-address?id=${item.id}`;
		try {
			await handleAPI(`/carts/remove-address?id=${item.id}`, {}, 'delete');

			const items = [...address];
			const index = items.findIndex((element) => element.id === item.id);
			if (index !== -1) {
				items.splice(index, 1);
			}

			if (item.isDefault && items.length > 0) {
				const val = items[0];

				await handleAPI(`/carts/update-address?id=${val.id}`, {
					isDefault: true,
				}, 'put');

				items[0].isDefault = true;
			}
			setAddress(items);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div>
			<Typography.Title level={3}>Select delivery address</Typography.Title>
			<Typography.Paragraph type='secondary'>
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem et
				architecto laudantium dolores rerum itaque officia totam exercitationem
				voluptate magnam, aliquid omnis. Perferendis quos doloremque itaque
				minima laudantium iste consequuntur.
			</Typography.Paragraph>
			{isloading ? (
				<Spin />
			) : (
				<>
					<List
						grid={{ gutter: 16, column: 2 }}
						dataSource={address}
						renderItem={(item) => (
							<List.Item key={item.id}>
								<a>
									<Card
										actions={[
											<Button
												key='btnEditAddress'
												icon={<BiEdit size={18} />}
												type='link'
												onClick={() => setIsEditAddress(item)}>
												Edit
											</Button>,
											<Button
												onClick={() =>
													Modal.confirm({
														title: 'Confirm',
														content:
															'Are you sure you want to remove this address?',
														onOk: () => handleRemoveAddress(item),
													})
												}
												key='btnEditAddress'
												icon={<TbTrash size={18} />}
												danger
												type='text'>
												Delete
											</Button>,
										]}
										className='shadow-hover'
										color='#e0e0e0'
										onClick={() => setAddressSelected(item)}>
										<Space
											className='d-flex'
											style={{ justifyContent: 'space-between' }}>
											<Typography.Title level={5}>{item.name}</Typography.Title>
											{item.id === addressSelected?.id ? (
												<IoCheckmarkCircle size={24} />
											) : (
												<IoCheckmarkCircleOutline size={24} />
											)}
										</Space>
										<Typography.Paragraph>{item.address}</Typography.Paragraph>
									</Card>
								</a>
							</List.Item>
						)}
					/>
				</>
			)}

			<Button
				className='mt-4'
				onClick={() => onSelectAddress(addressSelected as AddressModel)}
				size='large'
				type='primary'>
				Deliver address
			</Button>

			<Divider />
			<div className='mt-4'>
				<AddNewAddress
					onAddnew={(val) => {
						const items = [...address];
						if (isEditAddress) {
							const index = items.findIndex(
								(element) => element.id === isEditAddress.id
							);

							if (index !== -1) {
								items[index] = val;
							}

							setIsEditAddress(undefined);
						} else {
							items.push(val);
						}

						setAddress(items);
					}}
					values={isEditAddress}
				/>
			</div>
		</div>
	);
};

export default ShipingAddress;
