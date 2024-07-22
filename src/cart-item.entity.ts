import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToOne, JoinColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './product.entity';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;


  @ManyToOne(() => User, user => user.cartItems)
  user: User;

  @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE' })
  cart: Cart;

  @ManyToOne(() => Product, product => product.cartItems, { eager: true })
  product: Product;

  @ManyToOne(type => Order, order => order.items)
  order: Order;
  
  @Column()
  quantity: number;

  @Column({ nullable: true })
  selectedSize: string;
}
