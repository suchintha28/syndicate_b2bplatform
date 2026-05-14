-- Allow buyers to update (close) their own RFQs
-- Previously only sellers could update; buyers also need to close threads.

CREATE POLICY "rfqs: buyer can update own rfqs"
  ON rfqs FOR UPDATE
  USING (auth.uid() = buyer_id);
