import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CartItem } from "src/cart-item.entity";
import { Cart } from "src/cart.entity";
import { Order } from "src/order.entity";
import { Repository } from "typeorm";
import { NotificationService } from "./notification.service";
import { Notification } from "src/notif.entity";
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    private notificationService: NotificationService,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) { }


  async globalOrder(userId: number, orderData: Partial<Order>): Promise<Order> {
    try {
      const userCart = await this.cartRepository.findOne({ where: { user: { id: userId } } });
      if (!userCart) {
        console.error('Le panier de l\'utilisateur n\'a pas été trouvé');
        throw new Error('Le panier de l\'utilisateur n\'a pas été trouvé');
      }

      const cartItems = await this.cartItemRepository.find({
        where: { cart: { id: userCart.id } },
        relations: ['product'],
      });

      if (!cartItems || cartItems.length === 0) {
        console.error('Les items de panier n\'ont pas été trouvés');
        throw new Error('Les items de panier n\'ont pas été trouvés');
      }

      const totalAmount = cartItems.reduce((sum, item) => {
        const productPrice = parseFloat(item.product.price.replace(/\./g, '').replace(',', '.'));
        return sum + (productPrice * item.quantity);
      }, 0);

      // Créer une copie des items de panier pour la commande globale
      const orderItems = cartItems.map(item => ({ ...item }));

      const newOrder = this.orderRepository.create({
        ...orderData,
        user: { id: userId },
        items: orderItems,
        totalAmount,
      });

      const savedOrder = await this.orderRepository.save(newOrder);
      await this.notificationService.createNotifForOrder(`Nouvelle commande par ${orderData.username}, 
        adresse: ${orderData.address}, 
        tel: ${orderData.phoneNumber}`, newOrder.id);

      return savedOrder;
    } catch (error) {
      console.error('Échec de la création de la commande globale :', error);
      throw new Error(`Échec de la création de la commande globale : ${error.message}`);
    }
  }

  async orderSingle(userId: number, orderData: Partial<Order>, itemId?: number): Promise<Order> {
    let cartItems: CartItem[] = [];

    if (itemId) {
      let cartItem = await this.cartItemRepository.findOne({
        where: { id: itemId, cart: { user: { id: userId } } },
        relations: ['product'],
      });

      if (!cartItem) {
        const userChoice = await this.cartItemRepository.findOne({
          where: { product: { id: itemId }, user: { id: userId } }
        });
        if (!userChoice) {
          console.error('Product not found');
          throw new Error('Product not found');
        }

        cartItem = new CartItem();
        cartItem = userChoice;
        cartItem.user = { id: userId } as any;
        cartItem.cart = null;
        await this.cartItemRepository.save(cartItem);
      }

      cartItems.push(cartItem);
    } else {
      const userCart = await this.cartRepository.findOne({ where: { user: { id: userId } } });
      if (!userCart) {
        console.error('User cart not found');
        throw new Error('User cart not found');
      }

      cartItems = await this.cartItemRepository.find({
        where: { cart: { id: userCart.id } },
        relations: ['product'],
      });

      if (!cartItems || cartItems.length === 0) {
        console.error('Cart items not found');
        throw new Error('Cart items not found');
      }
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      const productPrice = parseFloat(item.product.price.replace(/\./g, '').replace(',', '.'));
      return sum + (productPrice * item.quantity);
    }, 0);

    const userOrder = this.orderRepository.create({
      ...orderData,
      user: { id: userId } as any,
      items: cartItems,
      totalAmount,
    });

    const savedOrder = await this.orderRepository.save(userOrder);
    await this.notificationService.createNotifForOrder(`Nouvelle commande par ${orderData.username}, 
        adresse: ${orderData.address}, 
        tel: ${orderData.phoneNumber}`,
      userOrder.id);

    return savedOrder;
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      const orders = await this.orderRepository.find({
        relations: ['items']
      });
      return orders;
    } catch (error) {
      console.error('Failed to fetch all orders:', error);
      throw new Error(`Failed to fetch all orders: ${error.message}`);
    }
  }

  async findOrderById(id: number): Promise<Order> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
  }

  //delete
  async deleteOrder(id: number): Promise<void> {
    await this.orderRepository.delete(id);
  }

  async DeleteAllOrder(): Promise<void> {
    await this.orderRepository.delete({})
  }
  async deleteAllOrderNotifications(): Promise<void> {
    try {
      await this.notificationRepository.delete({});
    } catch (error) {
      console.error('Error deleting all order notifications:', error);
      throw new Error('Failed to delete all order notifications');
    }
  }




}