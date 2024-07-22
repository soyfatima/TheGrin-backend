import { Entity, PrimaryGeneratedColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { User } from './user.entity';

@Entity()
export class Cart {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => CartItem, cartItem => cartItem.cart, { eager: true, cascade: true })
  items: CartItem[];

    @OneToOne(() => User, user => user.cart, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;
}
