import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from 'src/cart.entity';
import { CartItem } from 'src/cart-item.entity';
import { Product } from 'src/product.entity';
import { User } from 'src/user.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) { }

  async createCartForUser(userId: number): Promise<Cart> {
    try {
      // Fetch the user from the database
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new Error('User not found');
      }

      // Create a new cart for the user
      const newCart = this.cartRepository.create({ user });
      const savedCart = await this.cartRepository.save(newCart);

      // Update the user with the new cart
      user.cart = savedCart;
      await this.userRepository.save(user);

      return savedCart;
    } catch (error) {
    //  console.error('Erreur lors de la création du panier pour l\'utilisateur:', error.message);
      throw new InternalServerErrorException('Échec de la création du panier pour l\'utilisateur');
    }
  }

  //get usercart
  async getUserCart(userId: number): Promise<Cart> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['cart'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Fetch the cart
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    // If no cart exists, create one
    if (!cart) {
      cart = this.cartRepository.create({ user });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  //add item to cart if quantity was select by user
  async addToCartWithQuantity(userId: number, productId: number, quantity: number): Promise<CartItem> {
    try {
      let cart = await this.cartRepository.findOne({ where: { id: userId }, relations: ['items'] });
      if (!cart) {
        cart = new Cart();
        cart.id = userId;
        cart.items = [];
        await this.cartRepository.save(cart);
      }

      const product = await this.productRepository.findOne({ where: { id: productId } });
      if (!product) {
        throw new Error('Product not found');
      }

      let cartItem = await this.cartItemRepository.findOne({
        where: { cart, product },
      });

      if (cartItem) {
        cartItem.quantity += quantity;
      } else {
        cartItem = new CartItem();
        cartItem.cart = cart;
        cartItem.product = product;
        cartItem.quantity = quantity;
      }

      cartItem = await this.cartItemRepository.save(cartItem);

      return cartItem;
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique violation error code
        throw new Error('Item already in cart');
      }
    //  console.error('Error adding product to cart:', error.message);
      throw error;
    }
  }

  //add item to cart
  async addToCart1(userId: number, productId: number): Promise<CartItem> {
    try {
      let cart = await this.cartRepository.findOne({ where: { user: { id: userId } }, relations: ['items'] });

      if (!cart) {
        cart = await this.createCartForUser(userId); // Create cart if it doesn't exist
      }
      
      const product = await this.productRepository.findOne({ where: { id: productId } });

      if (!product) {
        throw new Error('Product not found');
      }
      const existingCartItem = cart.items.find(item => item.product.id === productId);

      if (existingCartItem) {
        throw new Error('Item already in cart');
      }

      // Create a new cart item
      const cartItem = new CartItem();
      cartItem.cart = cart;
      cartItem.product = product;
      cartItem.quantity = 1;

      // Save the cart item to the database
      const savedCartItem = await this.cartItemRepository.save(cartItem);

      return savedCartItem;
    } catch (error) {
      if (error.code === '23505') { 
      //  console.error('Error adding product to cart: Item already in cart');
        throw new Error('Item already in cart');
      }
     // console.error('Error adding product to cart:', error.message);
      throw error;
    }
  }

  //update cartItem form cart
  async updateCartItemFromCart(userId: number, itemId: number, updateData: Partial<CartItem>): Promise<CartItem> {
    const userCart = await this.getUserCart(userId);

    if (!userCart) {
      throw new Error('User cart not found');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } })

    if (!user) {
      throw new Error('User logged not found');

    }
    const cartItem = await this.cartItemRepository.findOne({ where: { id: itemId } });

    if (!cartItem) {
      throw new Error('CartItem not found');
    }

    // Update selectedSize field
    cartItem.selectedSize = updateData.selectedSize;
    cartItem.quantity = updateData.quantity;
    return this.cartItemRepository.save(cartItem);
  }

  //get the totalCartPrice before order
  async getTotalCartPrice(userId: number): Promise<{ totalPrice: number, totalQuantity: number }> {
    const cart = await this.getUserCart(userId);

    if (!cart || !cart.items || cart.items.length === 0) {
      return { totalPrice: 0, totalQuantity: 0 };
    }

    let totalPrice = 0;
    let totalQuantity = 0;

    cart.items.forEach((item) => {
      const product = item.product;
      const selectedSize = item.selectedSize;

      if (item.quantity && typeof item.quantity === 'number') {
        totalQuantity += item.quantity;
      }

     // const productPrice = parseFloat(product.price.replace(/,/g, ''));
     const productPrice = parseFloat(product.price.replace(/\./g, '').replace(',', '.'));

      if (!isNaN(productPrice) && item.quantity) {
        totalPrice += productPrice * item.quantity;
      } else {
        console.warn(`Invalid price or quantity for product: ${product.name}`);
      }
    });

    return { totalPrice, totalQuantity };
  }

  //   //update cartItem
  async updateCartItem(userId: number, productId: number, updateData: Partial<CartItem>): Promise<CartItem> {
    let cartItem = await this.cartItemRepository.findOne({
      where: { product: { id: productId }, user: { id: userId } },
      relations: ['product', 'user',],
    });

    if (!cartItem) {
      const product = await this.productRepository.findOne({ where: { id: productId } });

      if (!product) {
        throw new Error('Product not found');
      }

      // If the product exists, create a new cart item
      cartItem = new CartItem();
      cartItem.product = product;
      cartItem.user = await this.userRepository.findOne({ where: { id: userId } });
      if (!cartItem.user) {
        throw new Error('User not found');
      }
    }
    // Validate and update selectedSize and quantity fields
    if (updateData.selectedSize !== undefined) {
      cartItem.selectedSize = updateData.selectedSize;
    }
    if (updateData.quantity !== undefined) {
      cartItem.quantity = updateData.quantity;
    }
  
    if (updateData.selectedSize === undefined && updateData.quantity === undefined) {
      throw new Error('No update fields provided');
    }
  
    return this.cartItemRepository.save(cartItem);
  
  }

  async getSingleItemPrice(userId: number, itemId: number): Promise<{ totalPrice: number; totalQuantity: number }> {
    let cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cart: { user: { id: userId } } },
      relations: ['product'],
    });

    if (cartItem) {
     // const productPrice = parseFloat(cartItem.product.price.replace(/,/g, ''));
     const productPrice = parseFloat(cartItem.product.price.replace(/\./g, '').replace(',', '.'));
     const totalPrice = isNaN(productPrice) ? 0 : productPrice * cartItem.quantity;
      const totalQuantity = cartItem.quantity; 

      return { totalPrice, totalQuantity };
    } else {
      const product = await this.productRepository.findOne({ where: { id: itemId } });

      if (product) {
        const userChoiceQuantity = await this.cartItemRepository.findOne({
          where: { product: { id: itemId }, user: { id: userId } }
        });
        const totalQuantity = userChoiceQuantity ? userChoiceQuantity.quantity : 1;
    //    const productPrice = parseFloat(product.price.replace(/,/g, ''));
    const productPrice = parseFloat(product.price.replace(/\./g, '').replace(',', '.'));
    const totalPrice = isNaN(productPrice) ? 0 : productPrice * totalQuantity;

        return { totalPrice, totalQuantity };
      } else {
        throw new Error('Product not found');
      }
    }
  }

  //remove cartItem from cart
  async removeFromCart(userId: number, productId: number): Promise<Cart> {
    try {

      const cart = await this.cartRepository.findOne({ where: { user: { id: userId } }, relations: ['items'] });

      if (!cart) {
        throw new Error('Cart not found');
      }

      cart.items = cart.items.filter(item => item.product.id !== productId);
      const updatedCart = await this.cartRepository.save(cart);
      return updatedCart;
    } catch (error) {
     // console.error('Error removing product from cart:', error.message);
      throw error;
    }
  }



}