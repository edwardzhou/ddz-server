ActiveAdmin.register Channel do
  permit_params do
    permitted = []
    permitted << :channelId
    permitted << :channelName
    permitted << :description
    permitted << :paymentMethod
    permitted << :paymentMethod_id
    permitted << :enabled
    permitted
  end

  index do
    selectable_column
    id_column
    column :channelId
    column :channelName
    column :description
    column :paymentMethod
    column :enabled
    column :createAt
    column :updateAt
    actions
  end

  filter :channelId
  filter :channelName
  filter :description
  filter :enabled

  form do |f|
    f.inputs "Channel Details" do
      f.input :channelId, required: true
      f.input :channelName, required: true
      f.input :description
      f.input :paymentMethod_id, as: :select, required: true, collection: PaymentMethod.all, prompt: "请选择支付方式"
      f.input :enabled
    end
    f.actions
  end

end
