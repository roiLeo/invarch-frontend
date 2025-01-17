import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { web3Enable, web3FromAddress } from "@polkadot/extension-dapp";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { shallow } from "zustand/shallow";
import useApi from "../hooks/useApi";
import useAccount from "../stores/account";
import useModal, { MODAL_STYLE } from "../stores/modals";
import Button from "../components/Button";
import { getSignAndSendCallbackWithPromise } from "../utils/getSignAndSendCallback";
import { INVARCH_WEB3_ENABLE } from "../hooks/useConnect";

const schema = z
  .object({
    dao: z.string(),
    name: z.string().max(20),
    description: z.string().max(300),
    image: z.string().url().max(100),
  })
  .required();

const RegisterProject = ({ isOpen }: { isOpen: boolean; }) => {
  const { closeCurrentModal } = useModal(
    (state) => state,
    shallow
  );
  const selectedAccount = useAccount((state) => state.selectedAccount);
  const registerProjectForm = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });
  const [previewState, setPreviewState] = useState({
    name: "",
    description: "",
    image: "",
  });

  const api = useApi();

  const closeModal = () => {
    closeCurrentModal();
  };

  const handleRegister = registerProjectForm.handleSubmit(
    async ({ dao: core, name, description, image }) => {
      if (!selectedAccount) return;

      if (!api) return;

      if (!core) {
        toast.error("Core ID is required");

        return;
      }

      if (!Number.isInteger(Number(core))) {
        toast.error("Core ID should be an integer");

        return;
      }

      if (!name) {
        toast.error("Name is required");

        return;
      }

      if (!description) {
        toast.error("Description is required");

        return;
      }

      if (!image) {
        toast.error("Image URL is required");

        return;
      }

      toast.loading("Registering...");

      await web3Enable(INVARCH_WEB3_ENABLE);

      const injector = await web3FromAddress(selectedAccount.address);

      const calls = [api.tx.ocifStaking.registerDao(name, description, image)];

      try {
        await api.tx.inv4
          .operateMultisig(core, "", api.tx.utility.batch(calls))
          .signAndSend(
            selectedAccount.address,
            { signer: injector.signer },
            getSignAndSendCallbackWithPromise({
              onInvalid: () => {
                toast.dismiss();

                toast.error("Invalid registration");
              },
              onExecuted: () => {
                toast.dismiss();

                toast.loading("Waiting for confirmation...");
              },
              onSuccess: () => {
                toast.dismiss();

                toast.success("Registered successfully");
              },
              onDropped: () => {
                toast.dismiss();

                toast.error("Registration dropped");
              },
              onError: (error) => {
                toast.dismiss();

                toast.error(error);
              },
            }, api)
          );

        closeCurrentModal();
      } catch (error) {
        toast.dismiss();

        toast.error(`${error}`);
      }
    }
  );

  useEffect(() => {
    const subscription = registerProjectForm.watch((values) => {
      setPreviewState((oldValues) => ({
        ...oldValues,
        ...values,
      }));
    });

    return () => subscription.unsubscribe();
  }, [registerProjectForm]);

  useEffect(() => {
    registerProjectForm.reset();

    setPreviewState({
      name: "",
      description: "",
      image: "",
    });
  }, [isOpen, registerProjectForm]);

  return isOpen ? (
    <Dialog open={true} onClose={closeCurrentModal}>
      <>
        <Dialog.Title className="sr-only">Register New DAO</Dialog.Title>
        <div className="fixed inset-0 z-[49] h-screen w-full bg-invarchOffBlack/10 backdrop-blur-md" />
        <button className="pointer fixed top-0 right-0 z-50 flex cursor-pointer flex-col items-center justify-center p-3 text-gray-100 outline-none duration-500 hover:bg-opacity-100 hover:opacity-50">
          <XMarkIcon className="h-5 w-5" />
        </button>
        <Dialog.Panel>
          <>
            <div className={MODAL_STYLE}>
              {/* <div className="flex flex-row gap-4">
                <div className="relative w-full flex flex-col gap-4 overflow-hidden rounded-md border border-gray-50 bg-invarchOffBlack p-6 sm:flex-row">
                  <div className="flex w-full flex-col gap-4">
                    <div className="flex flex-shrink-0">
                      <img
                        src={previewState.image}
                        alt={previewState.name}
                        className="h-16 w-16 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/600x400?text=No+Image";
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-4">
                      <h4 className="font-bold text-invarchCream">{previewState.name}</h4>

                      <p className="text-sm text-invarchCream">
                        {previewState.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-gray-50 bg-invarchOffBlack p-6">
                  <h2 className="text-xl font-bold text-invarchCream">Register Project</h2>

                  <div className="mt-4 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-4">
                      <form
                        className="flex flex-col gap-4"
                        onSubmit={handleRegister}
                      >
                        <>
                          <div className="relative rounded-md  border border-neutral-300 px-3 py-2 shadow-sm focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-neutral-600">
                            <label
                              htmlFor="core"
                              className="block text-xs font-medium text-invarchCream"
                            >
                              Core ID
                            </label>
                            <input
                              type="text"
                              {...registerProjectForm.register("core", {
                                required: true,
                              })}
                              className="block w-full border-0 bg-transparent p-0 text-invarchCream focus:ring-transparent sm:text-sm"
                            />
                            {registerProjectForm.formState.errors.core ? (
                              <div className="text-red-400">
                                {registerProjectForm.formState.errors.core.message}
                              </div>
                            ) : null}
                          </div>

                          <div className="relative rounded-md  border border-neutral-300 px-3 py-2 shadow-sm focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-neutral-600">
                            <label
                              htmlFor="name"
                              className="block text-xs font-medium text-invarchCream"
                            >
                              Name
                            </label>
                            <input
                              type="text"
                              {...registerProjectForm.register("name", {
                                required: true,
                              })}
                              className="block w-full border-0 bg-transparent p-0 text-invarchCream focus:ring-transparent sm:text-sm"
                            />
                            {registerProjectForm.formState.errors.name ? (
                              <div className="text-red-400">
                                {registerProjectForm.formState.errors.name.message}
                              </div>
                            ) : null}
                          </div>

                          <div className="relative rounded-md  border border-neutral-300 px-3 py-2 shadow-sm focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-neutral-600">
                            <label
                              htmlFor="image"
                              className="block text-xs font-medium text-invarchCream"
                            >
                              Image URL
                            </label>
                            <input
                              type="text"
                              {...registerProjectForm.register("image", {
                                required: true,
                              })}
                              className="block w-full border-0 bg-transparent p-0 text-invarchCream focus:ring-transparent sm:text-sm"
                            />
                            {registerProjectForm.formState.errors.image ? (
                              <div className="text-red-400">
                                {registerProjectForm.formState.errors.image.message}
                              </div>
                            ) : null}
                          </div>

                          <div className="relative rounded-md  border border-neutral-300 px-3 py-2 shadow-sm focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-neutral-600">
                            <label
                              htmlFor="description"
                              className="block text-xs font-medium text-invarchCream"
                            >
                              Description
                            </label>
                            <textarea
                              {...registerProjectForm.register("description", {
                                required: true,
                              })}
                              className="block w-full border-0 bg-transparent p-0 text-invarchCream focus:ring-transparent sm:text-sm"
                            />
                            {registerProjectForm.formState.errors.description ? (
                              <div className="text-red-400">
                                {
                                  registerProjectForm.formState.errors.description
                                    .message
                                }
                              </div>
                            ) : null}
                          </div>

                          <button
                            type="submit"
                            disabled={
                              !registerProjectForm.formState.isValid &&
                              !registerProjectForm.formState.isDirty
                            }
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-amber-400 py-2 px-4 text-sm font-bold text-neutral-900 shadow-sm transition-colors hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:bg-neutral-300"
                          >
                            Register
                          </button>
                        </>
                      </form>
                    </div>
                  </div>
                </div>
              </div> */}
              <p className="text-invarchCream text-sm">
                Thank you for your interest in registering your DAO on InvArch! While an automatic & streamlined process to register your DAO will be available soon, the ability to deploy & register new DAO accounts is currently not supported in the UI.<br /><br />In the meantime, if you are interested in deploying & registering a new DAO account, please reach out to the InvArch core team via the <a target="_blank" className="text-invarchPink hover:underline underline-offset-2" rel="noreferrer" href="https://discord.gg/invarch">InvArch Discord Server</a>.
              </p>
              <div>
                <Button variant="secondary" mini onClick={closeModal}>Close</Button>
              </div>
            </div>
          </>
        </Dialog.Panel>
      </>
    </Dialog>
  ) : null;
};

export default RegisterProject;
