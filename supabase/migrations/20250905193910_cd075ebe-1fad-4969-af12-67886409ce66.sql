-- Add foreign key constraint for customer_id in stock_movements table
ALTER TABLE public.stock_movements 
ADD CONSTRAINT fk_stock_movements_customer 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;