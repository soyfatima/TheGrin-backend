import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { CartItem } from './cart-item.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  username: string;

  @Column()
  address: string;

  @Column()
  phoneNumber: string;

  @ManyToOne(() => User, user => user.orders)
  user: User;

  @OneToMany(type => CartItem, cartItem => cartItem.order, { eager: true })
  items: CartItem[];
  
  @Column({ type: 'numeric' })
  totalAmount: number;
}
